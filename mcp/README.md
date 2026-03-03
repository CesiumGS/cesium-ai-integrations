# 🔌 MCP (Model Context Protocol) Integrations

This directory contains Model Context Protocol servers and applications that integrate with Cesium's 3D geospatial platform.

## 📦 Available MCP Servers

### 🔧 Custom MCP Servers (Built In-House)

#### 🎥 [cesium-camera-server](./servers/camera-server/README.md)

Camera control operations for 3D navigation and positioning in CesiumJS applications.

**Tools:** `camera_fly_to`, `camera_set_view`, `camera_look_at_transform`, `camera_start_orbit`, `camera_stop_orbit`, `camera_get_position`, `camera_set_controller_options`

#### 🌍 [cesium-entity-server](./servers/entity-server/README.md)

Entity creation and management for 3D visualization in CesiumJS applications. Create and manage points, billboards, labels, 3D models, polygons, and polylines.

**Tools:** `entity_add_point`, `entity_add_billboard`, `entity_add_label`, `entity_add_model`, `entity_add_polygon`, `entity_add_polyline`, `entity_list`, `entity_remove`

### 🌐 External MCP Servers

#### 📚 [cesium-context7](./servers/cesium-context7/README.md)

Real-time access to Cesium documentation and code examples via Context7 service. Includes agent skills for VS Code and Claude Code.

## 🚀 Getting Started

Each MCP server has its own README with detailed setup and usage instructions. Navigate to the specific server directory to get started.

### Quick Start

```bash
# From the mcp directory
pnpm install

# Build all packages
pnpm run build
```

## 💻 Development

### Build Commands

```bash
pnpm run build              # Build all packages (shared, servers, PoC apps)
pnpm run build:shared       # Shared utilities
pnpm run build:camera       # Camera server
pnpm run build:entity       # Entity server
pnpm run build:poc          # PoC CesiumJs applications
pnpm run clean              # Clean build artifacts
```

### Run MCP Servers

```bash
pnpm run dev:camera       # Camera server (port 3002)
pnpm run dev:entity       # Entity server (port 3004)
```

### Run PoC Applications

**Web Browser Client:**

```bash
pnpm run start:web       # Start web client on http://localhost:8080
```

## 🔧 MCP Configuration

### Claude Desktop / Cline Configuration

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
    },
    "cesium-entity": {
      "command": "node",
      "args": ["{YOUR_WORKSPACE}/mcp/servers/entity-server/build/index.js"],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "ENTITY_SERVER_PORT": "3003",
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
│   ├── shared/              # Shared utilities (MCP base, communications)
│   ├── camera-server/       # Camera control MCP server
│   └── entity-server/       # Entity management MCP server
├── test-applications/cesium-js/
│   ├── packages/client-core/  # Shared client library
│   └── web-app/              # Browser application (localhost:8080)
└── package.json              # pnpm workspace root
```

### Communication Flow

1. **MCP Server** ←→ **AI Assistant** (Claude, etc.) via stdio
2. **MCP Server** ←→ **CesiumJS Client** via Server-Sent Events (SSE) or WebSocket
3. **CesiumJS Client** renders 3D visualization in browser

### Test Applications

The [test-applications/cesium-js](./test-applications/cesium-js/README.md) application demonstrates MCP server integrations:

- **Web App** - Browser-based 3D viewer on `http://localhost:8080`
- **Shared Core Library** (`packages/client-core/`) - CesiumApp initialization, managers, and utilities

## 🛠️ Technology Stack

- **TypeScript** - Type-safe development
- **MCP SDK** - Model Context Protocol integration
- **Zod** - Schema validation
- **CesiumJS** - 3D globe visualization
- **pnpm workspaces** - Monorepo management

## 🤝 Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📚 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Apps Documentation](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [CesiumJS Documentation](https://cesium.com/learn/cesiumjs/ref-doc/)

## 📄 License

See the [LICENSE](../LICENSE) file in the root of this repository.
