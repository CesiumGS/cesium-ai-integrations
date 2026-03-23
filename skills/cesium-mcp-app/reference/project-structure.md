# Cesium MCP App — Project Structure & Code Patterns

## Recommended Project Structure

Hard requirements:
- `src/index.ts` — Express server entry point
- `src/app/mcp-app.html` + `src/app/mcp-app.ts` — client app (HTML is the Vite entry, must be under the Vite root)
- `RESOURCE_URI` constant shared between server and client

Suggested layout:

```
my-cesium-app/
├── src/
│   ├── index.ts                # Express server + MCP endpoint
│   ├── server/
│   │   ├── csp.ts              # CSP_META
│   │   ├── tools.ts            # registerAppTool calls
│   │   └── scene-state.ts      # Server-side canonical state
│   ├── app/
│   │   ├── mcp-app.html        # HTML shell (Vite entry — no static Cesium script tags!)
│   │   ├── mcp-app.css         # Optional: toolbar + overlay styles
│   │   ├── mcp-app.ts          # Client: App, ontoolresult, scene setup
│   │   ├── cesium-loader.ts    # Dynamic CDN loading
│   │   └── toolbar.ts          # Optional: manual UI controls via callServerTool
│   └── shared/
│       ├── constants.ts        # RESOURCE_URI
│       └── types.ts            # Shared domain types
```

---

## Server Entry Point (`src/index.ts`)

Follow the [official MCP Apps docs](https://modelcontextprotocol.io/extensions/apps/build) for the Express + MCP boilerplate. Cesium-specific additions:

- Create a **per-request** `McpServer` instance (inside the `app.post("/mcp", ...)` handler) — not a shared singleton
- Call `registerTools(server)` before the transport connects
- Pass `CSP_META` in the resource `_meta` field:

```typescript
registerAppResource(server, RESOURCE_URI, RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => {
  const html = await fs.readFile(path.join(import.meta.dirname, "./app/mcp-app.html"), "utf-8");
  return { contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: CSP_META }] };
});
```

---

## Tool Registration (`src/server/tools.ts`)

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { sceneState } from "./scene-state.js";
import { RESOURCE_URI } from "../shared/constants.js";

const resourceMeta = { ui: { resourceUri: RESOURCE_URI } };

export function registerTools(server: McpServer): void {
  // Action tool — mutates state, returns structuredContent for client sync
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
      return {
        content: [{ type: "text" as const, text: `Layer "${layerId}" is now ${visible ? "visible" : "hidden"}.` }],
        structuredContent: { layers: sceneState.layerVisibility },
      };
    },
  );

  // Query tool — no UI navigation; use _meta: {} (not resourceMeta)
  registerAppTool(
    server,
    "get-scene-state",
    {
      title: "Get Scene State",
      description: "Returns current visibility for all layers. Use before making changes.",
      inputSchema: {},
      _meta: {},
    },
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify(sceneState, null, 2) }],
      structuredContent: { layers: sceneState.layerVisibility },
    }),
  );
}
```

> **Critical:** `inputSchema` must be a flat `ZodRawShape`, **not** a `z.object(...)` — causes `TS2345`.  
> Always return `structuredContent` — the client reads it in `ontoolresult` to sync without a round-trip.  
> Query tools must use `_meta: {}` — not `_meta: resourceMeta` — to avoid triggering UI navigation.

## Scene State (`src/server/scene-state.ts`)

The server holds canonical state. Tools mutate it and return `structuredContent`; the client never updates state directly.

```typescript
export interface SceneState {
  layerVisibility: Record<string, boolean>;
}

export const sceneState: SceneState = {
  layerVisibility: { SurroundingArea: true, Station: true },
};
```

## CSP Config (`src/server/csp.ts`)

See [csp-config.md](./csp-config.md) for the full domain table. The pattern for `CSP_META`:

```typescript
const hostUrl = process.env.HOST_URL?.trim();

export const CSP_META = {
  ui: {
    csp: {
      frameDomains: hostUrl ? [hostUrl] : [],   // never [process.env.HOST_URL] — can be [undefined]
      connectDomains: [
        "https://cesium.com", "https://*.cesium.com", "https://api.cesium.com",
        // "https://tile.googleapis.com",  // add for Google Photorealistic 3D Tiles
      ],
      resourceDomains: [
        "'unsafe-eval'", "'wasm-unsafe-eval'", "blob:",  // required for CesiumJS Draco/WASM/workers
        "https://cesium.com", "https://*.cesium.com", "https://api.cesium.com",
      ],
    },
  },
};
```

## Shared Constants (`src/shared/constants.ts`)

```typescript
export const RESOURCE_URI = "ui://my-cesium-app/mcp-app.html";
```

## CesiumJS Loader (`src/app/cesium-helpers/cesium-loader.ts`)

CesiumJS must be loaded dynamically — static `<script src="">` tags don't work in srcdoc iframes.

```typescript
declare let Cesium: any;

export const CESIUM_VERSION = "1.139.1";  // update to latest — check Context7
export const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

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

## Client App (`src/app/mcp-app.ts`)

Set `ontoolresult` **before** `app.connect()`. Use a single `handleToolResult` for both AI-triggered calls and toolbar calls.

```typescript
import { App } from "@modelcontextprotocol/ext-apps";
import { syncFromResult } from "./sync.js";
import { createLocalState } from "./state.js";
import { setupToolbar } from "./toolbar.js";

declare let Cesium: any;

const state = createLocalState();
const app = new App({ name: "My Cesium App", version: "1.0.0" }, undefined, { autoResize: false });

async function initialize(): Promise<void> {
  const viewer = await initScene();

  const applyCurrentStyle = (): void => applyStyle(viewer, state);
  applyCurrentStyle();

  const handleToolResult = (result: unknown): void => {
    syncFromResult(result, state);
    applyCurrentStyle();
  };

  app.ontoolresult = handleToolResult;          // MUST be before app.connect()
  setupToolbar(app, state, handleToolResult);

  await app.connect();
  app.sendSizeChanged({ width: 1200, height: 700 });  // confirm dimensions with user
}

initialize().catch(console.error);
```

> Prefer `ontoolresult` (fires after server returns `structuredContent`) over `ontoolinput` (fires before) unless you need immediate pre-response visual feedback.

## State Sync Helper (`src/app/sync.ts`)

```typescript
export function syncFromResult(result: unknown, state: LocalState): void {
  const r = result as Record<string, unknown> | null;
  if (!r || r.isError) return;
  const layers = (r.structuredContent as Record<string, unknown>)?.layers as Record<string, boolean> | undefined;
  if (!layers) return;
  for (const id of LAYER_IDS) {
    if (typeof layers[id] === "boolean") state.layerVisibility[id] = layers[id];
  }
}
```

## Toolbar (`src/app/toolbar.ts`)

Route all UI interactions through `app.callServerTool()` — never mutate state directly in handlers.

```typescript
export function setupToolbar(app: App, state: LocalState, onToolResult: (r: unknown) => void): void {
  const toolbar = document.getElementById("toolbar");
  if (!toolbar) return;

  // Button
  const btn = document.createElement("button");
  btn.className = "toolbar-btn";
  btn.textContent = "Isolate Category";
  toolbar.appendChild(btn);
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      onToolResult(await app.callServerTool({ name: "isolate-category", arguments: { categoryId: -2001120 } }));
    } finally { btn.disabled = false; }
  });

  // Toggle (checkbox)
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.layerVisible;
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode("Show Layer"));
  toolbar.appendChild(label);
  checkbox.addEventListener("change", async () => {
    checkbox.disabled = true;
    try {
      onToolResult(await app.callServerTool({ name: "toggle-layer", arguments: { layerId: "SurroundingArea", visible: checkbox.checked } }));
      checkbox.checked = state.layerVisible;  // reflect server authority
    } finally { checkbox.disabled = false; }
  });

  // Dropdown
  const select = document.createElement("select");
  select.className = "toolbar-btn";
  for (const opt of ["Day", "Night", "Cloudy"]) {
    const option = document.createElement("option");
    option.value = opt; option.textContent = opt;
    select.appendChild(option);
  }
  toolbar.appendChild(select);
  select.addEventListener("change", async () => {
    select.disabled = true;
    try {
      onToolResult(await app.callServerTool({ name: "set-atmosphere", arguments: { preset: select.value } }));
    } finally { select.disabled = false; }
  });
}
```

**Rules for every handler:** disable the control before the async call; pass result to `onToolResult()`; for reflected controls (checkbox, select), read back from `state` after sync — not from the DOM event; re-enable in `finally`.

### Sandcastle Toolbar → MCP App Mapping

| Sandcastle primitive | HTML element | Notes |
|---|---|---|
| `addToolbarButton(label, fn)` | `<button>` | Click → fixed args |
| `addDefaultToolbarButton(label, fn)` | `<button>` + call on init | Also invoke in `initialize()` |
| `addToggleButton(label, default, fn)` | `<input type="checkbox">` | `visible: checkbox.checked` |
| `addToolbarMenu(options, fn)` | `<select>` | `value: select.value` |

When Sandcastle passes numeric category IDs directly, define a named enum in `src/shared/` — LLMs work better with human-readable identifiers than raw numbers.

## HTML Templates

HTML lives under `src/app/` (the Vite root). Script path is relative to the HTML file.

**Minimal (no toolbar):**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Cesium App</title>
  <style>
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #000; }
    #cesiumContainer { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>
  <script type="module" src="./mcp-app.ts"></script>
</body>
</html>
```

**With toolbar overlay:**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Cesium App</title>
  <link rel="stylesheet" href="./mcp-app.css" />
</head>
<body>
  <div id="cesiumContainer" class="fullSize"></div>
  <div id="toolbar"></div>
  <script type="module" src="./mcp-app.ts"></script>
</body>
</html>
```

---

## CSS for Toolbar Overlay (`src/app/mcp-app.css`)

`pointer-events: none` on `#toolbar` prevents the container from blocking Cesium pan/zoom; individual controls re-enable it.

```css
html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #000; }
body { overflow: hidden; position: relative; }
.fullSize { display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
#cesiumContainer { width: 100%; height: 100%; }
#toolbar { position: absolute; top: 10px; left: 10px; z-index: 1; pointer-events: none; }
.toolbar-btn {
  pointer-events: all;
  background: rgba(38, 38, 38, 0.92); color: #dff;
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 5px;
  padding: 5px 12px; font-size: 12px; cursor: pointer;
}
.toolbar-btn:hover { background: rgba(60, 60, 70, 0.95); }
.toolbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

---

## Common Pitfalls

1. **Static `<script src="">` for CesiumJS** — doesn't work in srcdoc iframes; use the dynamic loader
2. **Skipping CSP analysis** — identify all required domains upfront; can't debug after sandboxing
3. **Missing `'unsafe-eval'` / `'wasm-unsafe-eval'` / `blob:`** in `resourceDomains` — breaks CesiumJS Draco/WASM/workers
4. **`inputSchema` as `z.object(...)`** — must be a flat `ZodRawShape` (causes `TS2345`)
5. **`ontoolresult` / `ontoolinput` bound after `app.connect()`** — handlers must be registered before connecting
6. **Missing `structuredContent` in tool response** — `ontoolresult` can't sync client state without it
7. **`get-scene-state` using `_meta: resourceMeta`** — query-only tools must use `_meta: {}` to avoid UI navigation
8. **`frameDomains: [process.env.HOST_URL]`** — can produce `[undefined]`; use `hostUrl ? [hostUrl] : []`
9. **Google Photorealistic 3D Tiles** — add `https://tile.googleapis.com` to both `connectDomains` and `resourceDomains`
10. **Forgetting `app.sendSizeChanged()`** — host uses default height without it; call after `app.connect()`
11. **Toolbar container blocking Cesium** — `pointer-events: none` on `#toolbar`, `pointer-events: all` on controls
12. **Setting control value from DOM event instead of state** — always read back from `state` after `callServerTool`; don't set element values from the input event
13. **Forgetting to re-enable controls in `finally`** — if `callServerTool` throws, the control stays disabled
14. **Outdated CesiumJS API from Sandcastle** — always verify with Context7 before using Sandcastle examples
15. **Default imagery fetch warnings** — disable with `imageryProvider: false` when using custom tilesets only
16. **Wrong build order** — run `vite build` before `tsc`
