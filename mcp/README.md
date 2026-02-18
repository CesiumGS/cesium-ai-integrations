# 🔌 MCP (Model Context Protocol) Integrations

This directory contains Model Context Protocol servers and applications that integrate with Cesium's 3D geospatial platform.

## 📦 Available MCP Servers

### 🔧 Custom MCP Servers (Built In-House)

#### 🎥 [cesium-camera-server](./servers/camera-server/README.md)

Camera control operations for 3D navigation and positioning in CesiumJS applications.

**Tools:** `camera_fly_to`, `camera_set_view`, `camera_look_at_transform`, `camera_start_orbit`, `camera_stop_orbit`, `camera_get_position`, `camera_set_controller_options`

#### 🎬 [cesium-animation-server](./servers/animation-server/README.md)

Animation and route-based movement for entities in CesiumJS applications.

**Tools:** `animation_create_from_route`, `animation_create_custom_path`, `animation_play`, `animation_pause`, `animation_update_speed`, `animation_remove`, `animation_list_active`, `animation_configure_path`, `animation_track_entity`, `animation_untrack_camera`

#### 📍 [cesium-entity-server](./servers/entity-server/README.md)

Entity management for adding and removing visual elements (points, billboards, labels, models, polygons, polylines) on the CesiumJS globe.

**Tools:** `entity_add_point`, `entity_add_billboard`, `entity_add_label`, `entity_add_model`, `entity_add_polygon`, `entity_add_polyline`, `entity_list`, `entity_remove`

#### 🕐 [cesium-clock-server](./servers/clock-server/README.md)

Clock and time management for controlling simulation time, lighting, and timeline in CesiumJS applications.

**Tools:** `clock_configure`, `clock_set_time`, `timeline_zoom_to_range`, `globe_set_lighting`, `clock_set_multiplier`

#### 🌍 [cesium-geolocation-server](./servers/geolocation-server/README.md)

Geolocation services powered by Google Maps APIs for searching places, finding nearby locations, and computing routes.

**Tools:** `geolocation_search`, `geolocation_nearby`, `geolocation_route`, `geolocation_get_user_location`

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
pnpm run build:poc          # PoC CesiumJs applications
pnpm run clean              # Clean build artifacts
```

### Run MCP Servers

```bash
pnpm run dev:camera       # Camera server (port 3002)
pnpm run dev:entity       # Entity server (port 3003)
pnpm run dev:clock        # Clock server (port 3004)
pnpm run dev:geolocation  # Geolocation server (port 3005)
pnpm run dev:animation    # Animation server (port 3006)
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
    },
    "cesium-clock": {
      "command": "node",
      "args": ["{YOUR_WORKSPACE}/mcp/servers/clock-server/build/index.js"],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "CLOCK_SERVER_PORT": "3004",
        "STRICT_PORT": "false"
      }
    },
    "cesium-geolocation": {
      "command": "node",
      "args": ["{YOUR_WORKSPACE}/mcp/servers/geolocation-server/build/index.js"],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "GEOLOCATION_SERVER_PORT": "3005",
        "GOOGLE_MAPS_API_KEY": "{YOUR_GOOGLE_MAPS_API_KEY}",
        "STRICT_PORT": "false"
      }
    },
    "cesium-animation": {
      "command": "node",
      "args": ["{YOUR_WORKSPACE}/mcp/servers/animation-server/build/index.js"],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "ANIMATION_SERVER_PORT": "3006",
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
│   ├── camera-server/             # Camera control MCP server
│   │   ├── src/
│   │   │   ├── tools/             # Camera control tools
│   │   │   ├── schemas.ts         # Zod schemas
│   │   │   └── index.ts           # Server entry point
│   │   └── package.json
│   ├── animation-server/          # Animation MCP server
│   │   ├── src/
│   │   │   ├── tools/             # Animation tools
│   │   │   ├── schemas.ts         # Zod schemas
│   │   │   └── index.ts           # Server entry point
│   │   └── package.json
│   ├── entity-server/             # Entity management MCP server
│   │   ├── src/
│   │   │   ├── tools/             # Entity tools
│   │   │   ├── schemas.ts         # Zod schemas (shared with clock-server)
│   │   │   └── index.ts           # Server entry point
│   │   └── package.json
│   ├── clock-server/              # Clock/time MCP server
│   │   ├── src/
│   │   │   ├── tools/             # Clock tools
│   │   │   └── index.ts           # Server entry point
│   │   └── package.json
│   └── geolocation-server/        # Geolocation MCP server
│       ├── src/
│       │   ├── tools/             # Geolocation tools
│       │   ├── services/          # Google Maps API services
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
│       └── web-app/               # Browser web application
│           ├── src/
│           │   └── app.ts         # Browser UI initialization
│           ├── index.html
│           └── package.json
└── package.json                   # Root package (workspaces)
```

### Communication Flow

1. **MCP Server** ←→ **AI Assistant** (Claude, etc.) via stdio
2. **MCP Server** ←→ **CesiumJS Client** via Server-Sent Events (SSE) or WebSocket
3. **CesiumJS Client** renders 3D visualization in browser

### PoC Applications

The [PoC/CesiumJs](./PoC/CesiumJs/README.md) application demonstrates MCP server integrations:

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
