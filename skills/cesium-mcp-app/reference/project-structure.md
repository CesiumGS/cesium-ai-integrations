# Cesium MCP App — Project Structure & Code Patterns

## Recommended Project Structure

This layout is a suggestion based on working examples — adapt it freely to fit the app's needs.

```
my-cesium-app/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env                        # CESIUM_ION_TOKEN, HOST_URL (gitignored)
├── .env.example
├── eval/
│   ├── evaluation.xml          # evaluation questions (app-specific)
│   └── report.md               # harness output (gitignored)
└── src/
    ├── index.ts                # Express server + MCP endpoint
    ├── mcp-app.html            # HTML shell (no static Cesium script tags!)
    ├── server/
    │   ├── tools.ts            # registerAppTool calls
    │   └── scene-state.ts      # Server-side state (layer visibility, etc.)
    ├── app/
    │   ├── mcp-app.ts          # Client: App, ontoolinput, Cesium viewer
    │   └── cesium-helpers/
    │       ├── cesium-loader.ts  # Dynamic CDN loading
    │       └── scene-loader.ts   # Tileset/terrain setup
    └── shared/
        ├── constants.ts        # RESOURCE_URI, CSP_META
        └── types.ts            # Shared Layer/View/State types
```

---

## Core Code Patterns

### Server Entry Point (`src/index.ts`)

```typescript
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import cors from "cors";
import express, { json, Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { RESOURCE_URI, CSP_META } from "./shared/constants.js";
import { registerTools } from "./server/tools.js";

async function startServer(): Promise<void> {
  const app = express();
  const port = parseInt(process.env.PORT ?? "3003");
  app.use(cors());
  app.use(json());

  app.post("/mcp", async (req: Request, res: Response) => {
    const server = new McpServer({ name: "My Cesium App", version: "1.0.0" });

    registerTools(server);

    registerAppResource(server, RESOURCE_URI, RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => {
      const html = await fs.readFile(path.join(import.meta.dirname, "./mcp-app.html"), "utf-8");
      return { contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: CSP_META }] };
    });

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const httpServer = app.listen(port, () => console.error(`Server on http://localhost:${port}`));

  const shutdown = () => {
    console.error("\nShutting down...");
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch(console.error);
```

### Tool Registration (`src/server/tools.ts`)

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { LAYER_IDS } from "../shared/types.js";
import { sceneState } from "./scene-state.js";
import { RESOURCE_URI } from "../shared/constants.js";

const resourceMeta = { ui: { resourceUri: RESOURCE_URI } };

export function registerTools(server: McpServer): void {
  registerAppTool(
    server,
    "toggle-layer",
    {
      title: "Toggle Layer Visibility",
      description: "Show or hide a data layer. Available: SurroundingArea, Station, RealityMesh.",
      inputSchema: {
        layerId: z.enum(LAYER_IDS).describe("Layer: SurroundingArea, Station, or RealityMesh"),
        visible: z.boolean().describe("true to show, false to hide"),
      },
      _meta: resourceMeta,
    },
    async ({ layerId, visible }) => {
      sceneState.layerVisibility[layerId] = visible;
      return { content: [{ type: "text" as const, text: `Layer "${layerId}" is now ${visible ? "visible" : "hidden"}.` }] };
    },
  );
}
```

> **Critical:** `inputSchema` must be a flat `ZodRawShape` (plain object of Zod fields), **not** a `z.object(...)`. Passing a `ZodObject` directly causes `TS2345`.  
> Tool handler returns `{ content: [{ type: "text", text: "..." }] }`.

### Scene State (`src/server/scene-state.ts`)

```typescript
export interface SceneState {
  layerVisibility: Record<string, boolean>;
  featurePickingEnabled: boolean;
}

export const sceneState: SceneState = {
  layerVisibility: { SurroundingArea: true, Station: true },
  featurePickingEnabled: false,
};
```

### Shared Constants (`src/shared/constants.ts`)

```typescript
export const RESOURCE_URI = "ui://my-cesium-app/mcp-app.html";

// CSP_META is a plain config object — not imported from the SDK.
// Define it here and reference it from registerAppResource in index.ts.
export const CSP_META = {
  ui: {
    csp: {
      frameDomains: [process.env.HOST_URL],
      connectDomains: [
        "https://cesium.com", "https://*.cesium.com",
        // add data source domains here — see csp-config.md
      ],
      resourceDomains: [
        // CesiumJS requires these for Draco decoder, WebAssembly, and web workers:
        "'unsafe-eval'", "'wasm-unsafe-eval'", "blob:",
        "https://cesium.com", "https://*.cesium.com",
        // add data source domains here
      ],
    },
  },
};
```

### CesiumJS Loader (`src/app/cesium-helpers/cesium-loader.ts`)

```typescript
declare let Cesium: any;

export const CESIUM_VERSION = "1.139.1";  // update to latest — check Context7
export const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

// CesiumJS must be loaded dynamically — static <script src=""> tags don't work in srcdoc iframes
export async function loadCesium(): Promise<void> {
  if (typeof Cesium !== "undefined") return;

  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = `${CESIUM_BASE_URL}/Widgets/widgets.css`;
  document.head.appendChild(cssLink);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${CESIUM_BASE_URL}/Cesium.js`;
    script.onload = () => { (window as any).CESIUM_BASE_URL = CESIUM_BASE_URL; resolve(); };
    script.onerror = () => reject(new Error("Failed to load CesiumJS from CDN"));
    document.head.appendChild(script);
  });
}
```

### Client App (`src/app/mcp-app.ts`)

```typescript
import { App } from "@modelcontextprotocol/ext-apps";
import { loadCesium } from "./cesium-helpers/cesium-loader.js";

declare let Cesium: any;
let viewer: any;

const app = new App({ name: "My Cesium App", version: "1.0.0" }, undefined, { autoResize: false });

// Handle tool inputs — MUST be set before app.connect()
app.ontoolinput = (params: any) => {
  const args = params.arguments as Record<string, unknown> | undefined;
  if (!args) return;

  const toolName = app.getHostContext()?.toolInfo?.tool.name;
  // toolName can be undefined due to host context timing on the first call —
  // infer from args shape as a fallback.
  const resolvedTool = toolName ?? (args.layerId !== undefined ? "toggle-layer" : "get-scene-state");
  switch (resolvedTool) {
    case "toggle-layer": {
      const tileset = tilesets[args.layerId as string];
      if (tileset) { tileset.show = args.visible as boolean; viewer.scene.requestRender(); }
      break;
    }
    // add cases for other tools
  }
};

async function initialize(): Promise<void> {
  await loadCesium();

  Cesium.Ion.defaultAccessToken =
    (window as any).__CESIUM_ION_TOKEN__ ?? // host-injected at runtime by the server
    import.meta.env.VITE_CESIUM_ION_TOKEN ??
    "";

  viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    // use latest API from Context7 — verify options before writing
  });

  // load tilesets, set up event handlers...

  await app.connect();
}

initialize().catch(console.error);
```

> **Critical:** Set `ontoolinput` **before** calling `app.connect()`. Handlers registered after connect will not fire.

### HTML Template (`src/mcp-app.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Cesium App</title>
  <!-- CesiumJS loaded dynamically — static script tags don't work in srcdoc iframes -->
  <style>
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #000; }
    #cesiumContainer { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>
  <script type="module" src="./app/mcp-app.ts"></script>
</body>
</html>
```

---

## Common Pitfalls

1. **Static `<script src="">` for CesiumJS** — doesn't work in srcdoc iframes; always use the dynamic loader pattern
2. **Skipping CSP analysis** — identify all required domains upfront; can't inspect errors after sandboxing
3. **Missing `'unsafe-eval'` / `'wasm-unsafe-eval'` / `blob:`** in `resourceDomains` — breaks CesiumJS Draco/WASM/workers
4. **`inputSchema` as `z.object(...)`** — must be a flat `ZodRawShape` object, not a Zod schema instance (causes `TS2345`)
5. **Binding `ontoolinput` after `app.connect()`** — handlers must be registered before connecting
6. **Outdated Cesium API from Sandcastle** — always verify with Context7 before using APIs from example code
7. **Wrong build order** — run `vite build` before `tsc`; server TypeScript import paths assume built HTML exists
8. **Default imagery fetch warnings** — disable with `imageryProvider: false` when using custom tilesets only
9. **`getHostContext()` timing** — `toolInfo?.tool.name` can be `undefined` on the first `ontoolinput` call. Always infer the tool from `args` shape as a fallback so the handler doesn't silently no-op.
