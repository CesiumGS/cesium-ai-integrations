# Cesium MCP App — CSP & Build Configuration

## CSP Domain Mapping

Analyze all API and data source patterns **before** building — CSP cannot be debugged after deployment into the iframe sandbox.

| Code Pattern | Required `connectDomains` / `resourceDomains` |
|---|---|
| `Cesium.Viewer(...)` | `https://cesium.com`, `https://*.cesium.com` (always required) |
| `Cesium.Ion` / `fromIonAssetId(...)` | `https://api.cesium.com` |
| `BingMapsImageryProvider` | `https://dev.virtualearth.net`, `https://*.blob.core.windows.net` |
| Google Photorealistic 3D Tiles | `https://tile.googleapis.com` |
| `OpenStreetMapImageryProvider` | `https://*.tile.openstreetmap.org` |
| iTwin / Bentley APIs | `https://api.bentley.com`, `https://*.bentley.com`, `https://*.cloudfront.net` |
| GeoJSON / KML / external data | Domain of each fetched URL |

> **Always add** `'unsafe-eval'`, `'wasm-unsafe-eval'`, and `blob:` to `resourceDomains` — required for CesiumJS Draco decoder, WebAssembly, and web workers. These are non-negotiable for any app that loads CesiumJS.

**Disable default imagery when using custom tilesets only:**
```typescript
const viewer = new Cesium.Viewer("cesiumContainer", { imageryProvider: false });
viewer.scene.globe.show = false; // if the globe itself is not needed
```

---

## Build Configuration

### `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  root: "src",              // vite root = src/ so relative imports work
  build: {
    outDir: "../build",
    rollupOptions: { input: "/mcp-app.html" },
  },
});
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*"]
}
```

### `package.json` scripts

```json
{
  "type": "module",
  "scripts": {
    "build": "vite build && tsc",
    "start": "node build/index.js",
    "check": "pnpm run format:check && pnpm run lint"
  }
}
```

> Vite bundles the client HTML first; `tsc` compiles the server TypeScript after. **This order matters.**

### Install dependencies

```bash
pnpm add @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk zod cors dotenv express
pnpm add -D typescript vite vite-plugin-singlefile tsx @types/node @types/cors @types/express
```
