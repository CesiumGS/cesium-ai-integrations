import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import OpenAI from "openai";
import cors from "cors";
import express, { json, Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const openai = new OpenAI({
  baseURL: process.env.OPENAI_URL,
  apiKey: process.env.OPENAI_KEY,
});

const cspMeta = {
  ui: {
    csp: {
      frameDomains: [process.env.HOST_URL],
      connectDomains: ["https://cesium.com", "https://*.cesium.com"],
      resourceDomains: ["https://cesium.com", "https://*.cesium.com"],
    },
  },
};

const resourceUri = "ui://cesium-codegen-skills/mcp-app.html";

/**
 * Skill references — populated from env after running `pnpm run upload-skills`.
 * Only include skills whose IDs are present so missing env vars don't cause API errors.
 */
function buildSkillRefs(): Array<{
  type: "skill_reference";
  skill_id: string;
}> {
  const ids = [
    process.env.SKILL_ID_VIEWER,
    process.env.SKILL_ID_ENTITIES,
    process.env.SKILL_ID_CAMERA,
    process.env.SKILL_ID_ANIMATION,
  ];
  return ids
    .filter((id): id is string => typeof id === "string" && id.trim() !== "")
    .map((skill_id) => ({ type: "skill_reference" as const, skill_id }));
}

/**
 * Extract HTML from the shell stdout in a Responses API output array.
 * Falls back to output_text if no shell_call_output items are present.
 * shell_call_output is not yet in the SDK union so the item is cast via unknown.
 */
function extractHtml(response: OpenAI.Responses.Response): string {
  const parts: string[] = [];
  for (const item of response.output) {
    if (item.type === "shell_call_output") {
      const shellItem = item as unknown as {
        output?: Array<{ stdout?: string }>;
      };
      if (Array.isArray(shellItem.output)) {
        for (const o of shellItem.output) {
          if (o.stdout) {
            parts.push(o.stdout);
          }
        }
      }
    }
  }
  return parts.length > 0 ? parts.join("") : (response.output_text ?? "");
}

async function startServer() {
  const app = express();
  const port: number = parseInt(process.env.PORT!);
  app.use(cors());
  app.use(json());

  app.all("/iframe", async (req: Request, res: Response) => {
    const { description } = req.query;

    if (description === undefined || description === "") {
      res.status(422).send("description query parameter is required");
      return;
    }

    const skillRefs = buildSkillRefs();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] =
      skillRefs.length > 0
        ? [
            {
              type: "shell",
              environment: {
                type: "container_auto",
                skills: skillRefs,
              },
            },
          ]
        : [];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      input: description as string,
      instructions: `Generate a complete, self-contained CesiumJS HTML page for the input. Do not include markdown formatting or code fences — output raw HTML only.
Use this Cesium ion access token: "${process.env.CESIUM_TOKEN}".
Use CesiumJS version 1.138 from https://cesium.com/downloads/cesiumjs/releases/.${skillRefs.length > 0 ? "\nUse the cesium-viewer, cesium-entities, cesium-camera, and cesium-animation skills to guide your implementation. Output ONLY the complete HTML page to stdout." : ""}`,
      ...(tools.length > 0 ? { tools } : {}),
    });

    res.send(extractHtml(response));
  });

  app.post("/mcp", async (req, res) => {
    const server = new McpServer({
      name: "MCP Codegen Skills Server",
      version: "1.0.0",
    });

    registerAppTool(
      server,
      "codegen",
      {
        title: "Generate code with skills",
        description:
          "Generate and execute CesiumJS code from a description, guided by Cesium-specific skills",
        inputSchema: {
          description: z.string(),
        },
        _meta: {
          ui: { resourceUri },
        },
      },
      async ({ description }) => {
        return {
          content: [
            {
              type: "text",
              text: `${process.env.HOST_URL}/iframe?description=${description}`,
            },
          ],
        };
      },
    );

    registerAppResource(
      server,
      resourceUri,
      resourceUri,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => {
        const html = await fs.readFile(
          path.join(import.meta.dirname, "mcp-app.html"),
          "utf-8",
        );
        return {
          contents: [
            {
              uri: resourceUri,
              mimeType: RESOURCE_MIME_TYPE,
              text: html,
              _meta: cspMeta,
            },
          ],
        };
      },
    );

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const httpServer = app.listen(port, () => {
    console.log(`MCP Server connected via HTTP on http://localhost:${port}`);
  });

  const shutdown = () => {
    console.log("\nShutting down...");
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  console.error(err);
});
