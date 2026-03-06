# 🔌 MCP (Model Context Protocol) Integrations

This directory contains Model Context Protocol servers and applications that integrate with Cesium's 3D geospatial platform.

## 📦 Available MCP Servers

### 🔧 CesiumJs MCP Servers

CesiumJs servers live in [`cesium-js/`](./cesium-js/README.md). See the [cesium-js README](./cesium-js/README.md) for installation, build instructions, and MCP client configuration.

| Server | Folder | Description |
|---|---|---|
| 🎥 [cesium-camera-server](./cesium-js/servers/camera-server/README.md) | `cesium-js/servers/camera-server/` | Camera control: fly-to, orbit, look-at, position queries |
| 🌍 [cesium-entity-server](./cesium-js/servers/entity-server/README.md) | `cesium-js/servers/entity-server/` | Entity management: points, billboards, labels, models, polygons, polylines, and more |
| 🎬 [cesium-animation-server](./cesium-js/servers/animation-server/README.md) | `cesium-js/servers/animation-server/` | Path-based animations, clock control, camera tracking, globe lighting |

#### 🎬 [cesium-animation-server](./servers/animation-server/README.md)

Animation and path-based entity control for CesiumJS applications. Create animated entities along custom paths with precise timing, camera tracking, and clock management.

**Tools:** `animation_create`, `animation_control`, `animation_remove`, `animation_list_active`, `animation_update_path`, `animation_camera_tracking`, `clock_control`, `globe_set_lighting`

#### 🗺️ [cesium-geolocation-server](./servers/geolocation-server/README.md)

Geolocation-aware search and routing capabilities with support for multiple providers (Google, Nominatim, Overpass, OSRM). Geocoding, POI search, route computation, and browser geolocation.

**Tools:** `geolocation_geocode`, `geolocation_search`, `geolocation_route`, `geolocation_get_user_location`

### 🌐 External MCP Servers

| Server | Folder | Description |
|---|---|---|
| 📚 [cesium-context7](./external/cesium-context7/README.md) | `external/cesium-context7/` | Real-time access to Cesium documentation and code examples via Context7. Includes agent skills for VS Code and Claude Code. |

## 🚀 Getting Started

See the individual READMEs for full details:

- **[cesium-js README](./cesium-js/README.md)** — install, build, run all CesiumJS servers and the web test application
- **[cesium-camera-server README](./cesium-js/servers/camera-server/README.md)** — camera tools reference and configuration
- **[cesium-entity-server README](./cesium-js/servers/entity-server/README.md)** — entity tools reference and configuration
- **[cesium-animation-server README](./cesium-js/servers/animation-server/README.md)** — animation tools reference and configuration
- **[cesium-context7 README](./external/cesium-context7/README.md)** — Context7 setup and agent skill usage


## 🏗️ Architecture

### Monorepo Structure

```
mcp/
├── cesium-js/               # CesiumJS integration (workspace root)
│   ├── servers/
│   │   ├── shared/              # Shared utilities (MCP base, communications)
│   │   ├── camera-server/       # Camera control MCP server
│   │   ├── entity-server/       # Entity management MCP server
│   │   └── animation-server/    # Animation and path control MCP server
│   ├── test-applications/
│   │   ├── packages/client-core/  # Shared client library
│   │   └── web-app/              # Browser application (localhost:8080)
│   ├── package.json             # pnpm workspace root
│   └── pnpm-workspace.yaml
├── external/
│   └── cesium-context7/         # Context7 external MCP server
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📚 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Apps Documentation](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [CesiumJS Documentation](https://cesium.com/learn/cesiumjs/ref-doc/)

## 📄 License

See the [LICENSE](../LICENSE) file in the root of this repository.
