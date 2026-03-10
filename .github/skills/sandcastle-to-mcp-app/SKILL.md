---
name: sandcastle-to-mcp-app
description: "Creates interactive MCP apps from Cesium Sandcastle examples. Use when user wants to convert a Sandcastle example (e.g., https://sandcastle.cesium.com/?id=aec-architectural-design) into an MCP App with tool-driven interactivity. Provides guidance on extracting example code, adapting it for MCP patterns."
---

# Convert Cesium Sandcastle Examples to MCP Apps

Transform interactive Cesium visualization examples from Sandcastle into full-featured MCP Apps with tool-driven interactivity.

## Overview

Sandcastle examples showcase Cesium capabilities through single-file HTML demonstrations. Converting one to an MCP App involves:

1. **Extract** the core visualization code from the example
2. **Analyze** code for CSP domains and dependencies (see [CSP Configuration](#csp-configuration))
3. **Design** MCP tools from interactive elements
4. **Implement** tool handlers and resource UI
5. **Configure** build system and deploy

### ⚠️ Important Guidelines

**When converting a Sandcastle example:**
- ✅ **DO** follow the patterns and code examples in this skill document
- ✅ **DO** extract code directly from the Sandcastle example URL
- ✅ **DO** analyze code upfront for CSP requirements (cannot debug in sandbox)
- ❌ **DO NOT** read other MCP apps in the workspace as templates
- ❌ **DO NOT** copy patterns from existing apps unless explicitly relevant

**Rationale:** Each MCP app serves a specific purpose. This skill provides all necessary patterns for Sandcastle conversion.


## Quick Start

### Step 1: Identify & Extract

**Identify the example:**
- URL format: `https://sandcastle.cesium.com/?id=EXAMPLE_ID`
- Extract the example ID and locate the code on Sandcastle

**Extract core components:**
```javascript
// 1. Viewer initialization
Cesium.Ion.defaultAccessToken = '...';
const viewer = new Cesium.Viewer('cesiumContainer', { /* options */ });

// 2. Data loading & setup
Cesium.GeoJsonDataSource.load('...').then(dataSource => {
  viewer.dataSources.add(dataSource);
});

// 3. Event handlers & interactivity
viewer.screenSpaceEventHandler.setInputAction(function(click) {
  // Handle clicks, compute properties, etc.
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

**What to extract:**
- Viewer configuration options
- Data source loading logic  
- Event handler logic
- Custom utility functions

### Step 2: Analyze Dependencies

**Before implementing, analyze the Sandcastle code for required CSP domains** (you won't have console access in sandbox):

| Code Pattern | Required Domains |
|------------|------------------|
| `Cesium.Viewer(...)` | `https://cesium.com`, `https://*.cesium.com` |
| `Cesium.Ion` or `fromIonAssetId(...)` | `https://api.cesium.com` |
| `BingMapsImageryProvider` | `https://dev.virtualearth.net`, `https://*.blob.core.windows.net` |
| `ITwinData` or iTwin APIs | `https://api.bentley.com`, `https://*.bentley.com`, `https://*.cloudfront.net` |
| `fromIonAssetId(2275207)` or `createGooglePhotorealistic3DTileset()` | `https://tile.googleapis.com` |
| GeoJSON/KML data sources | Domain of the fetched URL |

See [CSP Configuration](#csp-configuration) for complete domain mapping and configuration.

### Step 3: Design Your Tools


Convert interactive UI elements into MCP tools:

| Sandcastle UI Element | MCP Tool |
|----------------------|----------|
| Layer toggle checkbox | `toggleLayer(layerId, visible)` |
| Click-to-pick entity | `pickEntity(cartesian)` |
| Time slider | `setTime(isoString)` |
| Camera control | `setCamera(position, direction)` |
| Property editor | `updateProperty(entityId, key, value)` |

**Tool schemas** (use Zod):
```typescript
import { z } from 'zod';

export const toggleLayerSchema = z.object({
  layerId: z.string().describe("Layer identifier"),
  visible: z.boolean().describe("Whether layer should be visible")
});
```

**Tool responses** (structured data):
```typescript
{
  success: boolean;
  data?: { entityId?: string; properties?: Record<string, any>; message?: string; };
  error?: string;
}
```

### Step 4: Implement MCP App


**Server-side tool handler:**
```typescript
import { registerAppTool, registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';

export function setupTools(server) {
  registerAppTool(
    server,
    {
      name: 'toggle-layer',
      description: 'Toggle visibility of a data layer',
      inputSchema: z.object({ layerId: z.string(), visible: z.boolean() }),
      _meta: { ui: { resourceUri: 'resource://mcp-app.html' } }
    },
    async ({ layerId, visible }) => ({
      success: true,
      data: { layerId, visible, message: `Layer ${layerId} ${visible ? 'shown' : 'hidden'}` }
    })
  );

  registerAppResource(
    server,
    { uri: 'resource://mcp-app.html', name: 'Cesium Viewer', mimeType: 'text/html' },
    async () => ({
      contents: [{
        uri: 'resource://mcp-app.html',
        mimeType: 'text/html',
        data: readFileSync(resolve(__dirname, 'mcp-app.html'), 'utf-8'),
        _meta: { ui: { csp: { /* see CSP Configuration section */ } } }
      }]
    })
  );
}
```

**Client-side resource UI:**
```typescript
// src/mcp-app.ts
import { App } from '@modelcontextprotocol/ext-apps';

const app = new App({ name: 'Cesium Sandcastle', version: '1.0.0' });

// Initialize Cesium viewer
Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN';
const viewer = new Cesium.Viewer('cesium-container', {
  terrain: Cesium.Terrain.fromUrl(Cesium.Ion.terrainsUrl())
});

// Handle tool results from LLM
app.ontoolresult = (result) => {
  if (result.data?.layerId !== undefined && result.data?.visible !== undefined) {
    const layer = viewer.imageryLayers.get(parseInt(result.data.layerId));
    if (layer) layer.show = result.data.visible;
  }
};

// Optional: Keep model informed of user interactions
viewer.screenSpaceEventHandler.setInputAction((click) => {
  const picked = viewer.scene.pick(click.position);
  if (Cesium.defined(picked?.id)) {
    app.updateModelContext({ selectedEntity: picked.id.id });
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// Connect to host
async function connectApp() {
  try { await app.connect(); }
  catch (error) { console.warn('Failed to connect:', error); }
}
connectApp();
```

See [Project Structure](#project-structure) for complete file organization and [Configuration Reference](#configuration-reference) for build setup.

## Configuration Reference

### CSP Configuration

**Critical:** Analyze Sandcastle code upfront to identify all required domains. You won't have console access in the sandboxed iframe.

#### Code Pattern → Domain Mapping

| Code Pattern | Required CSP Domains |
|------------|----------------------|
| `Cesium.Viewer(...)` | `https://cesium.com`, `https://*.cesium.com` (always required) |
| `Cesium.Ion` or `fromIonAssetId(...)` | `https://api.cesium.com` |
| `BingMapsImageryProvider` | `https://dev.virtualearth.net`, `https://*.blob.core.windows.net` |
| `ITwinData` or iTwin APIs | `https://api.bentley.com`, `https://*.bentley.com`, `https://*.cloudfront.net` |
| `fromIonAssetId(2275207)` or `createGooglePhotorealistic3DTileset()` | `https://tile.googleapis.com` |
| `OpenStreetMapImageryProvider` | `https://*.tile.openstreetmap.org` |
| `GoogleEarthEnterpriseImageryProvider` | `https://www.google.com`, `https://*.googleapis.com` |
| GeoJSON/KML/external data | Domain of the fetched URL |

#### Base CSP Configuration

```typescript
const cspMeta = {
  ui: {
    csp: {
      frameDomains: [process.env.HOST_URL],
      scriptSrc: ["'unsafe-inline'"],  // Required for vite-plugin-singlefile
      connectDomains: ["https://cesium.com", "https://*.cesium.com"],
      resourceDomains: ["https://cesium.com", "https://*.cesium.com"],
    },
  },
};
```

#### Adding Data Source Domains

Extend `connectDomains` and `resourceDomains` based on code analysis:

```typescript
// Example: iTwin + Google Photorealistic Tiles
const cspMeta = {
  ui: {
    csp: {
      frameDomains: [process.env.HOST_URL],
      scriptSrc: ["'unsafe-inline'"],
      connectDomains: [
        "https://cesium.com",
        "https://*.cesium.com",
        "https://api.cesium.com",        // Ion assets
        "https://api.bentley.com",       // iTwin API
        "https://*.bentley.com",         // iTwin services
        "https://*.cloudfront.net",      // iTwin CDN
        "https://tile.googleapis.com",   // Google tiles
      ],
      resourceDomains: [/* same as connectDomains */],
      permissionsPolicy: {
        unload: ["*"],  // Allow third-party unload handlers if needed
      },
    },
  },
};
```

#### Imagery Provider Configuration

**Disable default imagery** when using custom 3D tilesets only:
```typescript
const viewer = new Cesium.Viewer("cesiumContainer", {
  imageryProvider: false,  // Disable default Bing Maps
});
scene.globe.show = false;  // Hide globe if not needed
```

**Why:** Default Bing Maps attempts worldwide tile fetches. Disabling prevents non-fatal console warnings when tiles are unavailable.

### Build & Dependencies


**Install pnpm:**
```bash
npm install -g pnpm
# Or: corepack enable && corepack prepare pnpm@latest --activate
```

**Install dependencies:**
```bash
pnpm add @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk zod
pnpm add -D typescript vite vite-plugin-singlefile concurrently tsx @types/node
```

**Vite configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
    outDir: 'build',
    emptyOutDir: false
  }
});
```

**Package.json scripts:**
```json
{
  "scripts": {
    "build": "pnpm run build:ts && pnpm run build:ui",
    "build:ts": "tsc",
    "build:ui": "vite build",
    "dev": "concurrently \"tsc -w\" \"vite serve\"",
    "serve": "node build/index.js"
  }
}
```

**Setup and build:**
```bash
cd your-app
pnpm install
cp .env.example .env  # Add CESIUM_ION_TOKEN=your_token
pnpm run build        # Compiles TypeScript + bundles UI
```

### Project Structure

```
sandcastle-app/
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite bundler with vite-plugin-singlefile
├── main.ts                # Tool/resource registration
├── index.ts               # Server entry point
├── mcp-app.html           # HTML template (Cesium CDN)
├── src/
│   ├── mcp-app.ts         # Client app (App, ontoolresult, viewer)
│   ├── tools/             # Tool handlers
│   ├── schemas.ts         # Zod schemas
│   └── global.css         # Styles
├── build/                 # Output: *.js, *.d.ts, mcp-app.html (bundled)
├── .env                   # CESIUM_ION_TOKEN (gitignored)
└── README.md
```

## Implementation Patterns


### Extracting Sandcastle Code

**Data source loading:**
```javascript
// Sandcastle pattern
Cesium.GeoJsonDataSource.load(Cesium.IonResource.fromAssetId(1390830))
  .then(dataSource => viewer.dataSources.add(dataSource));

// MCP: wrap in tool handler, return status
async ({ assetId }) => {
  const ds = await Cesium.GeoJsonDataSource.load(Cesium.IonResource.fromAssetId(assetId));
  viewer.dataSources.add(ds);
  return { success: true, data: { dataSourceId: ds.name } };
}
```

### Event Handling


```typescript
// Keep event handlers in client UI
viewer.screenSpaceEventHandler.setInputAction((click) => {
  const picked = viewer.scene.pick(click.position);
  if (Cesium.defined(picked?.id)) {
    app.updateModelContext({ selectedEntity: picked.id.id });
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

### Ion Assets & Animation

**Ion token setup:**
```typescript
Cesium.Ion.defaultAccessToken = process.env.CESIUM_ION_TOKEN || 'YOUR_TOKEN';
```

**Animation tool example:**
```typescript
registerAppTool(server, {
  name: 'set-time',
  inputSchema: z.object({
    isoDateTime: z.string(),
    multiplier: z.number().optional()
  })
}, async ({ isoDateTime, multiplier }) => {
  const time = Cesium.JulianDate.fromDate(new Date(isoDateTime));
  viewer.clock.currentTime = time;
  if (multiplier) viewer.clock.multiplier = multiplier;
  return { success: true };
});
```

### Adapting Specific Examples

| Example Type | Key Code to Extract | MCP Tools |
|-------------|---------------------|-----------|
| **AEC/Layers** | `viewer.imageryLayers.add(...)`, entity picking | `toggleLayer`, `pickEntity`, `getProperties` |
| **GeoJSON/KML** | `GeoJsonDataSource.load(...)`, styling | `loadData`, `filterEntities`, `highlightEntity` |
| **Animation** | `viewer.clock.startTime`, timeline | `setTime`, `playAnimation`, `stopAnimation` |

## Testing & Troubleshooting

### Local Testing

```bash
pnpm run serve  # Start server

# In another terminal:
cd <ext-apps>/examples/basic-host
SERVERS='["http://localhost:3001/mcp"]' pnpm run start
```

### Common Issues

**UI doesn't appear:**
- ✅ Verify `_meta.ui.resourceUri` in tool matches registered resource URI
- ✅ Check build output includes `mcp-app.html`
- ✅ Look for errors in `registerAppResource` callback

**Assets don't load:**
- ✅ **Analyze code first** using the [CSP pattern table](#csp-configuration)
- ✅ Verify all domains in `connectDomains` and `resourceDomains`
- ✅ Check `scriptSrc: ["'unsafe-inline'"]` is present (required for vite-plugin-singlefile)
- ✅ For Google tiles (asset 2275207), add `https://tile.googleapis.com`
- ✅ Ion 404 errors: verify token has access to specific asset IDs

**Tile fetch warnings:**
- ✅ Disable default imagery if using custom tilesets: `imageryProvider: false`
- ✅ Ensure imagery provider domains are in CSP
- ✅ Use code analysis pattern from Step 2 to identify providers

**Tool results not updating UI:**
- ✅ Verify `app.ontoolresult` is set BEFORE `app.connect()`
- ✅ Check tool handler returns proper `{ success, data, error }` format
- ✅ Add `console.log` in `ontoolresult` to debug

**Build errors:**
- ✅ Run `pnpm install` to ensure dependencies are installed
- ✅ Check TypeScript errors: `pnpm run build:ts`
- ✅ Verify `vite.config.ts` includes `vite-plugin-singlefile`

**Performance issues:**
```typescript
// Limit detail, disable unused features
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000;
new Cesium.Viewer('cesiumContainer', {
  shadows: false,
  requestRenderMode: true  // Only render when needed
});
```

### State Synchronization

**Problem:** Server can't directly access client viewer.

**Solutions:**
1. **App-only tools** (client-side): `_meta: { ui: { visibility: ['app'] } }`
2. **State tracking**: Server maintains state, client applies changes via `ontoolresult`
3. **Message passing**: `app.updateModelContext({ ... })` to inform server

## Common Pitfalls

1. **Skipping CSP analysis** - Analyze code upfront; can't debug in sandbox
2. **Incomplete CSP domains** - Use pattern table to identify all required domains
3. **Missing `'unsafe-inline'`** - Required for vite-plugin-singlefile
4. **Default imagery conflicts** - Disable for custom tilesets: `imageryProvider: false`
5. **Google tiles CSP** - Add `https://tile.googleapis.com` if using asset 2275207
6. **Unhandled `app.connect()` errors** - Wrap in try/catch
7. **Event binding order** - Bind handlers BEFORE `app.connect()`
8. **Token management** - Use environment variables for Ion tokens
9. **Missing tool-resource link** - Set `_meta.ui.resourceUri`
10. **Build configuration** - Use `vite-plugin-singlefile` for single-file HTML

## References

- [Cesium Documentation](/cesiumgs/cesium) - CesiumJS API (Context7 MCP)
- [MCP Apps SDK Examples](<path-to-ext-apps>/examples)
- [Cesium Sandcastle](https://sandcastle.cesium.com/)
- [3D Tiles Specification](/websites/ogc_cs_22-025r4) (Context7 MCP)
