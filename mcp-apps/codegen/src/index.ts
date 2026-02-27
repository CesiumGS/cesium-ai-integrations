import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
    registerAppTool,
    registerAppResource,
    RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";
import OpenAI from "openai";
import cors from "cors";
import express, { json, Request, Response } from 'express';
import fs from "node:fs/promises";
import path from "node:path";
import { z } from 'zod';

const openai = new OpenAI({
    baseURL: process.env.OPENAI_URL,
    apiKey: process.env.OPENAI_KEY,
});

const cspMeta = {
    ui: {
        csp: {
            frameDomains: [
                process.env.HOST_URL,
            ],
            connectDomains: [
                "https://cesium.com",
                "https://*.cesium.com",
            ],
            resourceDomains: [
                "https://cesium.com",
                "https://*.cesium.com",
            ],
        },
    },
};

const resourceUri = "ui://cesium-codegen/mcp-app.html";

async function startServer() {
    const app = express();
    const port: number = parseInt(process.env.PORT!);
    app.use(cors());
    app.use(json());

    app.all('/iframe', async (req: Request, res: Response) => {
        const { description } = req.query;

        if (description === undefined || description === '') {
            res.status(422);
        } else {
            const response = await openai.responses.create({
                input: description as string,
                instructions:
                    "Generate Cesium page for input. Don't include markdown formatting.\n" +
                    `Use this access token: \"${process.env.CESIUM_TOKEN}\"\n.` +
                    "Use CesiumJS version 1.138 from https://cesium.com/downloads/cesiumjs/releases/",
                model: process.env.OPENAI_MODEL,
            });

            res.send(response.output_text);
        }
    });

    app.post("/mcp", async (req, res) => {
        const server = new McpServer({
            name: "MCP App Server",
            version: "1.0.0",
        });

        registerAppTool(
            server,
            "codegen",
            {
                title: 'Generate code',
                description: 'Generate and execute code from description',
                inputSchema: {
                    description: z.string(),
                },
                _meta: {
                    ui: { resourceUri }
                },
            },
            async ({ description }) => {
                return {
                    content: [{ type: 'text', text: `${process.env.HOST_URL}/iframe?description=${description}` }],
                };
            },
        );

        registerAppResource(
            server,
            resourceUri,
            resourceUri,
            { mimeType: RESOURCE_MIME_TYPE },
            async () => {
                const html = await fs.readFile(path.join(import.meta.dirname, "mcp-app.html"), "utf-8");
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