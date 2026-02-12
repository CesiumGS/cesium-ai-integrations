# Cesium MCP Camera Server

A monorepo of Model Context Protocol (MCP) servers for controlling CesiumJS applications through AI assistants.

## 📦 Packages

This monorepo contains the following packages:

### 🎥 [@cesium-mcp/camera-server](./servers/camera-server/README.md)

Camera control operations for 3D navigation and positioning.

**Tools:** `camera_fly_to`, `camera_set_view`, `camera_look_at_transform`, `camera_start_orbit`, `camera_stop_orbit`, `camera_get_position`, `camera_set_controller_options`

### 🔧 @cesium-mcp/shared

Shared utilities including SSE and WebSocket communication servers.

### 🧪 [PoC/CesiumJs](./PoC/CesiumJs/README.md)

Proof-of-concept CesiumJS web application that demonstrates mcp servers integrations.

## 🚀 Installation

```bash
# From the mcp directory
pnpm install

# Build all packages
pnpm run build
```

## 💻 Development

### Build Commands

```bash
pnpm run build              # Build all packages (shared, camera server, PoC apps)
pnpm run build:shared       # Shared utilities
pnpm run build:camera       # Camera server
pnpm run build:poc          # PoC CesiumJs applications
pnpm run clean              # Clean build artifacts
```

### Run MCP Server

```bash
pnpm run dev:camera       # Camera server (port 3002)
```

### Run PoC Applications

**Web Browser Client:**

```bash
pnpm run start:web       # Start web client on http://localhost:8080
```

## 🔧 Usage

### Running the Camera Server

After building, you can run the camera server:

```bash
pnpm run dev:camera
```

### MCP Configuration

#### Claude Desktop / Cline Configuration

Add to your MCP client configuration file:

- **Cline (VS Code)**: Settings → Extensions → Cline → MCP Servers → Configure `cline_mcp_settings.json`

**Server Configurations:**

```json
{
  "mcpServers": {
    "cesium-camera": {
      "command": "node",
      "args": ["{YOUR_WORKSPACE}/mcp/servers/camera-server/build/index.js"],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "CAMERA_SERVER_PORT": "3002",
        "STRICT_PORT": "false"
      }
    }
  }
}
```

**Notes:**

- Replace `{YOUR_WORKSPACE}` with your actual installation path
- Use forward slashes (`/`) in paths for cross-platform compatibility
- `STRICT_PORT=false` allows flexible port assignment (recommended for cloud deployment)
- `COMMUNICATION_PROTOCOL=websocket` enables bidirectional communication (recommended over SSE)

## 🏗️ Architecture

### Monorepo Structure

```
mcp/
├── servers/
│   ├── shared/                    # Shared utilities
│   │   ├── src/
│   │   │   ├── communications/    # SSE and WebSocket servers
│   │   │   ├── mcp/               # MCP server base classes
│   │   │   ├── models/            # Configuration models
│   │   │   └── index.ts           # Barrel exports
│   │   └── package.json
│   └── camera-server/             # Camera control MCP server
│       ├── src/
│       │   ├── tools/             # Camera control tools
│       │   ├── schemas.ts         # Zod schemas
│       │   └── index.ts           # Server entry point
│       └── package.json
├── PoC/
│   └── CesiumJs/                  # Proof-of-concept applications
│       ├── packages/
│       │   └── client-core/       # Shared client library
│       │       ├── src/
│       │       │   ├── managers/  # Camera controller
│       │       │   ├── communications/ # SSE and WebSocket clients
│       │       │   ├── shared/    # Utility functions
│       │       │   ├── types/     # TypeScript definitions
│       │       │   ├── cesium-app.ts  # Main CesiumApp class
│       │       │   └── index.ts   # Package exports
│       │       └── package.json
│       ├── web-app/               # Browser web application
│       │   ├── src/
│       │   │   └── app.ts         # Browser UI initialization
│       │   ├── index.html
│       │   └── package.json

│       └── package.json           # Workspace configuration
└── package.json                   # Root package (workspaces)
```

### Communication Flow

1. **MCP Server** ←→ **AI Assistant** (Claude, etc.) via stdio
2. **MCP Server** ←→ **CesiumJS Client** via Server-Sent Events (SSE) or WebSocket
3. **CesiumJS Client** renders 3D visualization in browser

### PoC Applications

The PoC application uses the shared `@cesium-mcp/client-core` library:

- **Web App** - Browser-based 3D viewer
  - Runs on `http://localhost:8080`
  - ES modules served via HTTP

**Shared Core Library** (`packages/client-core/`)

- CesiumApp initialization and management
- MCP Servers Managers
- Communication handlers (SSE, WebSocket)
- Utility functions and type definitions

## 🛠️ Technology Stack

- **TypeScript** - Type-safe development
- **MCP SDK** - Model Context Protocol integration
- **Zod** - Schema validation
- **CesiumJS** - 3D globe visualization
- **pnpm workspaces** - Monorepo management

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## 📗 License

Apache 2.0. See [LICENSE](../LICENSE).
