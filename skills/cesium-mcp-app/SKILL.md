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
- **HTML/CSS dependencies**: inline `<style>` blocks, `@import` statements, and any relative CSS/template files the example depends on

For Sandcastle inputs, also fetch any relative CSS/template files referenced via `@import` and reproduce those styles in the app.

#### Detecting Sandcastle UI Components

Scan for `Sandcastle.addToolbarButton`, `addDefaultToolbarButton`, `addToggleButton`, and `addToolbarMenu` calls. If any are present, ask:

> "This Sandcastle example has toolbar buttons: [list labels]. Do you want interactive UI controls in the MCP App that mirror these? (HTML buttons/checkboxes over the globe, callable by both AI and the user.)"

If yes, map them to tools + UI elements in Phase 3. If no, expose the same actions as tools only.

> Sandcastle code may reference older CesiumJS APIs. Always verify against the latest version using Context7.

### From a description

Confirm with the user:
1. What scene elements exist (tilesets, terrain, imagery, entities)?
2. What actions should the LLM be able to take (toggle layers, navigate, query state)?
3. Any external APIs needed (iTwin, Google Maps, custom data)?
4. **Does the app need interactive UI controls visible to the user** (buttons, toggles, dropdowns rendered over the Cesium viewer)? If the description mentions buttons, panels, toolbars, controls, or a UI — confirm and note them. If unclear, ask: "Should the app also have interactive HTML controls (buttons/checkboxes) visible over the globe that the user can click, in addition to AI-callable tools?"
5. **What iframe dimensions does the app need?** Ask: "What width and height should the viewer iframe be? (default: full width, 700 px tall)" — use the confirmed values in `app.sendSizeChanged({ width, height })` after `app.connect()`.

---

## Phase 2: Look Up Latest CesiumJS APIs

**Always use Context7** to fetch up-to-date CesiumJS documentation for any API the app uses — the Sandcastle example may reference deprecated classes or outdated patterns.

> **STOP if Context7 is unavailable.** Before writing any code, verify with `resolve-library-id` (`/cesiumgs/cesium`). If unavailable, tell the user to add it to their MCP config (`.vscode/mcp.json`) and stop.

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

Map interactive elements to tools:

| Scenario | MCP Tool |
|---|---|
| Layer toggle | `toggle-layer(layerId, visible)` |
| Camera preset | `set-camera-view(view)` |
| Time/animation | `set-time(isoDateTime, multiplier?)` |
| Feature picking | `toggle-feature-picking(enabled)` |
| State query | `get-scene-state()` |
| Entity property | `update-entity(id, property, value)` |

**Sandcastle toolbar → tool mapping** (see [project-structure.md](./reference/project-structure.md) for the HTML counterpart):

| Sandcastle pattern | Tool shape |
|---|---|
| Multiple buttons toggling the same concept | Single `set-X(id, visible)` with enum |
| `addToggleButton` | `set-X(enabled: boolean)` |
| `addToolbarMenu` | `set-X(value: enumValue)` |
| `addDefaultToolbarButton` | Also call the tool in scene init |

Tool design rules:
- Prefer **fewer, high-value tools** — don't map one tool per button
- Group semantically related buttons into a single enum-driven tool
- Write descriptions that tell the LLM exactly what values are valid

### Does the App Need Interactive UI?

Add a toolbar when any of these are true: Sandcastle source had toolbar primitives and user confirmed; description mentions buttons/panels/controls; user explicitly asked. Otherwise use the minimal HTML shell (tools only).

---

## Phase 4: Implement the App

See the [official MCP Apps docs](https://modelcontextprotocol.io/extensions/apps/build) for the base server/client boilerplate, then load **[📁 Project Structure & Code Patterns](./reference/project-structure.md)** for all Cesium-specific patterns (scene state, dynamic CesiumJS loader, toolbar, HTML template, pitfalls).

Most-commonly missed rules:
- `inputSchema` must be a flat `ZodRawShape` — never `z.object(...)` (causes `TS2345`)
- Set `ontoolresult` **before** `app.connect()`
- Always return `structuredContent` from every tool
- Query-only tools use `_meta: {}`, not `_meta: resourceMeta`
- For public Sandcastle ion examples: don't require `CESIUM_ION_TOKEN`
- Call `app.sendSizeChanged({ width, height })` after `app.connect()` (confirm dimensions with user in Phase 1)

### Interactive UI: CSS + Toolbar

If the app includes interactive controls:

1. Create `src/app/mcp-app.css` — toolbar as absolute overlay over `#cesiumContainer`
2. Add `<link rel="stylesheet">` in HTML `<head>` and `<div id="toolbar">` sibling to `#cesiumContainer`
3. Create `src/app/toolbar.ts` — build controls with `document.createElement`, always call `app.callServerTool()` (never mutate state directly)
4. Call `setupToolbar(app, state, handleToolResult)` **before** `app.connect()`

---

## Phase 5: Configure CSP & Build

Load **[⚙️ CSP & Build Configuration](./reference/csp-config.md)** before writing any CSP constants. CSP cannot be debugged after the app is sandboxed — identify all required domains upfront.

Must-have `resourceDomains` for every Cesium app: `'unsafe-eval'`, `'wasm-unsafe-eval'`, `blob:`

Also enforce these two CSP safety checks:
- If the app uses Google Photorealistic 3D Tiles, include `https://tile.googleapis.com` in both `connectDomains` and `resourceDomains`.
- Never emit `frameDomains: [process.env.HOST_URL]` directly; normalize and conditionally include `HOST_URL` so `frameDomains` is `[]` when unset (prevents `hostCapabilities.sandbox.csp.frameDomains[0]` Zod type errors).

---

## Phase 6: Test & Evaluate

> **API keys:** Only require keys for what the app actually uses. Public Sandcastle ion examples don't need `CESIUM_ION_TOKEN`. For private ion assets or third-party services (Bing, iTwin, etc.), require the relevant keys and pause for the user to provide them.

Load **[✅ Evaluation Guide](./reference/evaluation.md)** to create 10 scenario-based questions that test whether an LLM can use your app's tools to complete realistic geospatial tasks. See **[scripts/evaluation-text.xml](./scripts/evaluation-text.xml)** and **[scripts/evaluation-visual.xml](./scripts/evaluation-visual.xml)** for worked examples.

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
| [🧪 evaluation-text.xml](./scripts/evaluation-text.xml) | Example text evaluation questions |
| [🧪 evaluation-visual.xml](./scripts/evaluation-visual.xml) | Example visual evaluation questions |

---

## Quick Links

- **CesiumJS API** — Context7, library ID `/cesiumgs/cesium`
- **3D Tiles Spec** — Context7, library ID `/websites/ogc_cs_22-025r4`
- **Cesium Sandcastle** — https://sandcastle.cesium.com/
- **MCP Apps SDK** — `@modelcontextprotocol/ext-apps`
- **MCP Apps official docs** — https://modelcontextprotocol.io/extensions/apps/build (reference for new SDK features, lifecycle hooks, and host capabilities)
