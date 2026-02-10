# Cesium MCP Workspace

Monorepo containing the Cesium MCP web client application and shared core library.

## Structure

```
CesiumJs/
├── packages/
│   └── client-core/          # Shared core library (@cesium-mcp/client-core)
│       ├── src/
│       │   ├── managers/     # Camera, Entity, Animation, etc.
│       │   ├── communications/ # SSE and WebSocket communication
│       │   ├── shared/       # Utility functions
│       │   ├── types/        # TypeScript type definitions
│       │   ├── cesium-app.ts # Main CesiumApp class
│       │   └── index.ts      # Package exports
│       └── build/            # Compiled output
└── web-app/                  # Browser web application
    ├── src/
    │   ├── app.ts           # Browser UI initialization
    │   └── css/
    ├── .env.example         # Environment template
    ├── index.html
    └── dist/                # Build output
```

## Quick Start

### Install Dependencies

```bash
# From CesiumJs directory
pnpm install
```

### Build All

```bash
# Build everything (core → web)
pnpm run build

# Or build individually
pnpm run build:core
pnpm run build:web
```

### Run Application

```bash
pnpm run start:web
# Opens http://localhost:8080
```

## Development Workflow

### 1. Setup Configuration

```bash
cd web-app
cp .env.example .env
# Edit .env with your Cesium token from https://ion.cesium.com/tokens
```

### 2. Start MCP Servers

```bash
# From mcp directory
pnpm run dev:camera
```

### 3. Run Web Application

```bash
# From mcp/PoC/CesiumJs/
pnpm run start:web
# Opens http://localhost:8080
```

## Architecture

The web application uses the `@cesium-mcp/client-core` shared library:

- ✅ **Core Library:** CesiumApp, all managers, communications, utilities, types
- 🎨 **Web App:** UI initialization, configuration loading, DOM handling

### Cesium Loading Strategy

The app loads Cesium from CDN rather than bundling via npm. This approach:
- **Simplifies builds**: No need to configure asset loaders or copy 200MB+ of Cesium workers, shaders, and terrain data
- **Reduces bundle size**: App bundle stays small (~100KB) while Cesium loads separately and caches in the browser
- **Avoids complexity**: No `CESIUM_BASE_URL` configuration, worker bundling, or dynamic import handling required

The global `Cesium` object is declared in TypeScript and accessed throughout the client-core library.

### Web App (web-app/src/app.ts)
- Loads config from environment variables (injected at build time)
- Browser-specific DOM event handling
- ES modules built with esbuild

## Configuration

### Environment Variables

Create `web-app/.env`:
```bash
CESIUM_ACCESS_TOKEN=your_token_here
MCP_PROTOCOL=websocket
MCP_CAMERA_PORT=3002
```

These variables are injected at build time by esbuild and accessed via `process.env` in the application code.

## Building

### Development Builds
```bash
# Watch mode for core library
cd packages/client-core && pnpm run build:watch

# Watch mode for web app
cd web-app && pnpm run build:watch
```

### Production Builds
```bash
# Build everything
pnpm run build
```

## Troubleshooting

### "Cannot find module '@cesium-mcp/client-core'"

1. Build the core library first:
   ```bash
   pnpm run build:core
   ```

2. Ensure TypeScript path mappings are correct in tsconfig.json

### Web App Module Resolution

Web app uses esbuild with alias configuration. Check `web-app/esbuild.config.cjs` has correct path to client-core build output.

## Clean Build

```bash
# Clean all build outputs
pnpm run clean

# Then rebuild
pnpm run build
```
