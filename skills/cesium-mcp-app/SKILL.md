---
name: cesium-mcp-app
description: "Use to create, build, or modify a Cesium MCP App from any input: a Sandcastle URL (sandcastle.cesium.com), a GitHub raw link to example code, or a plain-language description of what the app should do. Provides step-by-step guidance for building CesiumJS visualizations with full MCP tool-driven interactivity. Use this skill whenever the user provides a Sandcastle link, asks to 'build an MCP app for X', 'make a Cesium viewer interactive via MCP', 'add MCP tools to a Cesium scene', or describes a set of CesiumJS capabilities they want exposed as tools. Always uses Context7 MCP to verify the latest CesiumJS API before writing code, so the output is never based on stale Sandcastle examples."
---

# Building a Cesium MCP App

Create a full-featured MCP App that exposes a CesiumJS visualization through LLM-controlled tools. The input can be:

- **A Sandcastle URL** — `https://sandcastle.cesium.com/?id=EXAMPLE_ID`
- **A GitHub raw link** — pointing to Sandcastle example source
- **A description** — plain-language spec of the scene and desired tools
- **An existing MCP App** — when modifying, start from the existing `src/` files rather than recreating from scratch; identify which tools, CSP entries, or scene setup need to change and edit those specifically

---

## Phase 1: Understand the Input

### From a URL (Sandcastle or GitHub raw)

Use the `fetch_webpage` tool to retrieve the source code. Extract:
- Viewer configuration and initialization parameters
- Data loading logic (tilesets, Ion assets, GeoJSON, etc.)
- Interactive elements (layer toggles, camera presets, time controls, picking)
- Third-party APIs and domains used (drives CSP config)

> Sandcastle code may use older CesiumJS APIs. Always verify against the latest version using Context7 before implementing.

### From a description

Confirm with the user:
1. What scene elements exist (tilesets, terrain, imagery, entities)?
2. What actions should the LLM be able to take (toggle layers, navigate, query state)?
3. Any external APIs needed (iTwin, Google Maps, custom data)?

---

## Phase 2: Look Up Latest CesiumJS APIs

**Always use Context7** to fetch up-to-date CesiumJS documentation for any API the app uses — the Sandcastle example may reference deprecated classes or outdated patterns.

> **STOP if Context7 is unavailable.** Before writing any code, verify that Context7 MCP is configured and accessible by calling `resolve-library-id` with `/cesiumgs/cesium`. If the tool is missing, returns an error, or is not listed in the available MCP servers, **do not proceed**. Instead, tell the user:
> _"The Context7 MCP server is required but is not configured or accessible. Please add it to your MCP configuration (`.vscode/mcp.json` or your client's MCP config) and try again."_

```
Use Context7 MCP:
  library ID: /cesiumgs/cesium
  e.g.: query-docs("Cesium3DTileset fromIonAssetId")
        query-docs("Viewer constructor options terrain")
        query-docs("Cesium.Color fromCssColorString")
```

In particular, verify:
- Viewer construction options and any deprecated properties
- Terrain/tileset loading (`Cesium.Terrain`, `Cesium3DTileset.fromIonAssetId`)
- Camera manipulation APIs
- Feature picking APIs

---

## Phase 3: Design MCP Tools

Map interactive UI elements (or described capabilities) to MCP tools:

| Scenario | MCP Tool |
|---|---|
| Layer toggle checkbox | `toggle-layer(layerId, visible)` |
| Camera preset buttons | `set-camera-view(view)` |
| Time/animation slider | `set-time(isoDateTime, multiplier?)` |
| Hover/click picking | `toggle-feature-picking(enabled)` |
| State query | `get-scene-state()` |
| Entity property | `update-entity(id, property, value)` |

Each tool should be self-contained — write descriptions that tell the LLM exactly what values are valid (e.g., list valid enum values in the description string).

---

## Phase 4: Implement the App

Load **[📁 Project Structure & Code Patterns](./reference/project-structure.md)** for the canonical directory layout and all required code patterns (server entry point, tool registration, scene state, client app, HTML template, and common pitfalls).

Key constraints to keep in mind:
- `inputSchema` must be a flat `ZodRawShape` — never `z.object(...)` (causes `TS2345`)
- Set `ontoolinput` **before** calling `app.connect()`
- CesiumJS must be loaded dynamically — static `<script src="">` tags don't work in srcdoc iframes

---

## Phase 5: Configure CSP & Build

Load **[⚙️ CSP & Build Configuration](./reference/csp-config.md)** before writing any CSP constants. CSP cannot be debugged after the app is sandboxed — identify all required domains upfront.

Must-have `resourceDomains` for every Cesium app: `'unsafe-eval'`, `'wasm-unsafe-eval'`, `blob:`

---

## Phase 6: Test & Evaluate

> **Check for API keys first.** Before running the evaluation, confirm that the user has provided a `.env` file containing any required API keys (e.g. `CESIUM_ION_TOKEN`, `BING_MAPS_KEY`, `ITWIN_CLIENT_ID`). If the `.env` file is missing or keys are absent, **pause and ask the user to supply them** before continuing — the app will not function correctly without them.

Load **[✅ Evaluation Guide](./reference/evaluation.md)** to create 10 scenario-based questions that test whether an LLM can use your app's tools to complete realistic geospatial tasks. See **[scripts/evaluation.xml](./scripts/evaluation.xml)** for a worked example.

  Evaluation quality signals:
- **9–10 / 10** — tool descriptions and schemas are well-designed
- **7–8 / 10** — review failing questions; tune descriptions or add enum hints
- **< 7 / 10** — revisit tool naming, input schema descriptions, or `get-scene-state` coverage

---

## Reference Files

| File | Purpose |
|---|---|
| [📁 project-structure.md](./reference/project-structure.md) | Canonical layout, all code patterns, common pitfalls |
| [⚙️ csp-config.md](./reference/csp-config.md) | CSP domain table, vite/tsconfig/package.json templates |
| [✅ evaluation.md](./reference/evaluation.md) | How to write and run evaluations |
| [🧪 evaluation.xml](./scripts/evaluation.xml) | Example evaluation question set |

---

## Quick Links

- **CesiumJS API** — Context7, library ID `/cesiumgs/cesium`
- **3D Tiles Spec** — Context7, library ID `/websites/ogc_cs_22-025r4`
- **Cesium Sandcastle** — https://sandcastle.cesium.com/
- **MCP Apps SDK** — `@modelcontextprotocol/ext-apps`
