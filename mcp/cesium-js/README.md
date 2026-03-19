# CesiumJS MCP Servers

pnpm monorepo containing MCP servers and test applications for controlling [CesiumJS](https://cesium.com/platform/cesiumjs/) 3D globe visualizations from AI assistants.

## 📦 Packages

| Package                                                                         | Description                                                                          | Port |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---- |
| [`@cesium-mcp/shared`](./servers/shared/README.md)                              | Shared MCP server base, SSE/WebSocket communications, common types                   | —    |
| [`@cesium-mcp/camera-server`](./servers/camera-server/README.md)                | Camera control: fly-to, orbit, look-at, position queries                             | 3002 |
| [`@cesium-mcp/entity-server`](./servers/entity-server/README.md)                | Entity management: points, billboards, labels, models, polygons, polylines, and more | 3003 |
| [`@cesium-mcp/animation-server`](./servers/animation-server/README.md)          | Path-based animations, clock control, camera tracking, globe lighting                | 3004 |
| [`@cesium-mcp/imagery-server`](./servers/imagery-server/README.md)              | Imagery layer management: add, remove, and list imagery providers                    | 3005 |
| [`@cesium-mcp/client-core`](./test-applications/packages/client-core/README.md) | Shared browser client library (managers, communications)                             | —    |
| [`@cesium-mcp/cesium-js`](./test-applications/README.md)                        | Browser web application (CesiumJS viewer)                                            | 8080 |

## 🛠️ MCP Servers

### 🎥 [cesium-camera-server](./servers/camera-server/README.md)

Camera control and 3D navigation in CesiumJS applications.

| Tool                            | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `camera_fly_to`                 | Smoothly animate the camera to a destination with easing options |
| `camera_set_view`               | Instantly position the camera without animation                  |
| `camera_look_at_transform`      | Lock the camera to orbit around a specific point                 |
| `camera_start_orbit`            | Begin automated circular orbit around a target                   |
| `camera_stop_orbit`             | Stop the current orbit and restore manual control                |
| `camera_get_position`           | Query current camera position, orientation, and view bounds      |
| `camera_set_controller_options` | Adjust camera movement constraints and behavior                  |

### 🌍 [cesium-entity-server](./servers/entity-server/README.md)

Create and manage 3D entities on the CesiumJS globe.

| Tool                   | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `entity_add_point`     | Colored point marker with size control               |
| `entity_add_billboard` | Image/icon marker with pixel offset and sizing       |
| `entity_add_label`     | 3D text label with font, color, and outline styling  |
| `entity_add_model`     | GLTF/GLB model placement with scale and orientation  |
| `entity_add_polygon`   | Area visualization with fill and outline styling     |
| `entity_add_polyline`  | Path/line rendering with width and color             |
| `entity_add_box`       | 3D box for buildings, containers, or volumetric data |
| `entity_add_corridor`  | Path with width for roads, pipelines, or routes      |
| `entity_add_cylinder`  | Cylinder or cone for towers or pillars               |
| `entity_add_ellipse`   | Circular area for zones or coverage regions          |
| `entity_add_rectangle` | Geographic rectangle for regions or bounding boxes   |
| `entity_add_wall`      | Vertical wall for barriers or fences                 |
| `entity_list`          | List all entities currently in the scene             |
| `entity_remove`        | Remove an entity by ID                               |

### 🎬 [cesium-animation-server](./servers/animation-server/README.md)

Animate 3D models along paths and control the scene clock.

| Tool                        | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `animation_create`          | Create an entity animated along custom position samples      |
| `animation_control`         | Play, pause, or adjust playback speed of an animation        |
| `animation_remove`          | Remove an animation and its entity from the scene            |
| `animation_list_active`     | List all active animations                                   |
| `animation_update_path`     | Update the path samples of an existing animation             |
| `animation_camera_tracking` | Follow an animated entity with the camera (or stop tracking) |
| `clock_control`             | Configure global clock time, speed, and playback state       |
| `globe_set_lighting`        | Enable realistic day/night globe lighting                    |

### 🗺️ [cesium-imagery-server](./servers/imagery-server/README.md)

Manage imagery layers on the CesiumJS globe.

| Tool             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `imagery_add`    | Add imagery layer from various provider types            |
| `imagery_remove` | Remove imagery layer by index, name, or remove all       |
| `imagery_list`   | List all imagery layers with visibility and provider info |

## 🏗️ Structure

```
cesium-js/
├── servers/
│   ├── shared/              # @cesium-mcp/shared
│   ├── camera-server/       # @cesium-mcp/camera-server
│   ├── entity-server/       # @cesium-mcp/entity-server
│   ├── animation-server/    # @cesium-mcp/animation-server
│   └── imagery-server/      # @cesium-mcp/imagery-server
├── test-applications/
│   ├── packages/
│   │   └── client-core/     # @cesium-mcp/client-core
│   └── web-app/             # @cesium-mcp/cesium-js (browser viewer)
├── package.json             # pnpm workspace root
└── pnpm-workspace.yaml
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22 (Node 22 LTS is required for the built-in global `WebSocket` API)
- [pnpm](https://pnpm.io/) >= 8

### Install & Build

```bash
# From this directory
pnpm install

# Build all packages in dependency order
pnpm run build
```

## 💻 Build Commands

```bash
pnpm run build              # Build everything (shared → servers → test apps)
pnpm run build:shared       # @cesium-mcp/shared only
pnpm run build:camera       # @cesium-mcp/camera-server only
pnpm run build:entity       # @cesium-mcp/entity-server only
pnpm run build:animation    # @cesium-mcp/animation-server only
pnpm run build:imagery      # @cesium-mcp/imagery-server only
pnpm run build:cesium-js    # @cesium-mcp/cesium-js (web app) only
pnpm run clean              # Remove all build artifacts
```

## ▶️ Running

### MCP Servers

```bash
pnpm run dev:camera        # Camera server on port 3002
pnpm run dev:entity        # Entity server on port 3003
pnpm run dev:animation     # Animation server on port 3004
pnpm run dev:imagery       # Imagery server on port 3005
```

### Web Application

```bash
pnpm run start:web         # Browser viewer on http://localhost:8080
```

Start the web app before connecting AI tools so the CesiumJS viewer is ready to receive commands.

## 🔧 MCP Server Configuration

Add the servers to your MCP client (e.g., Claude Desktop, Cline):

```json
{
  "mcpServers": {
    "cesium-camera": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/mcp/cesium-js/servers/camera-server/build/index.js"
      ],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "CAMERA_SERVER_PORT": "3002",
        "STRICT_PORT": "false"
      }
    },
    "cesium-entity": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/mcp/cesium-js/servers/entity-server/build/index.js"
      ],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "ENTITY_SERVER_PORT": "3003",
        "STRICT_PORT": "false"
      }
    },
    "cesium-animation": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/mcp/cesium-js/servers/animation-server/build/index.js"
      ],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "ANIMATION_SERVER_PORT": "3004",
        "STRICT_PORT": "false"
      }
    },
    "cesium-imagery": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/mcp/cesium-js/servers/imagery-server/build/index.js"
      ],
      "env": {
        "COMMUNICATION_PROTOCOL": "websocket",
        "IMAGERY_SERVER_PORT": "3005",
        "STRICT_PORT": "false"
      }
    }
  }
}
```

**Notes:**

- Replace `{YOUR_WORKSPACE}` with the absolute path to your local clone
- Use forward slashes (`/`) in paths for cross-platform compatibility
- `STRICT_PORT=false` lets the server pick an available port if the default is busy
- `COMMUNICATION_PROTOCOL=websocket` enables bidirectional communication (preferred over SSE)

## 🏛️ Architecture

```
AI Assistant (Claude, Cline, etc.)
        │  stdio (MCP)
        ▼
  MCP Server (camera / entity / animation / imagery)
        │  WebSocket or SSE
        ▼
 CesiumJS Web App (localhost:8080)
        │
        ▼
   3D Globe Visualization
```

1. The **AI assistant** calls MCP tools over stdio.
2. Each **MCP server** forwards commands to the browser via WebSocket or SSE.
3. The **web application** executes the commands against the CesiumJS viewer.

## 🤝 Contributing

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Apache-2.0 — see [LICENSE](../../LICENSE).
