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

### 🌐 Geolocation MCP Server

| Server | Folder | Description |
|---|---|---|
| 🌍 [cesium-geolocation-server](./geolocation-server/README.md) | `geolocation-server/` | Geolocation-aware search and routing using free, open-source providers (Nominatim, Overpass, OSRM) |

### 💻 Cesium MCP Apps

Cesium MCP Apps live in [`mcp-apps/`](./mcp-apps/README.md). See the [mcp-apps README](./mcp-apps/README.md) for installation, build instructions, and MCP client configuration.

| Server | Folder | Description |
|---|---|---|
| 🪄 [cesium-codegen](./mcp-apps/codegen/README.md) | `mcp-apps/codegen/` | Cesium views code generation |

### 🌐 External MCP Servers

| Server | Folder | Description |
|---|---|---|
| 📚 [cesium-context7](./external/cesium-context7/README.md) | `external/cesium-context7/` | Real-time access to Cesium documentation and code examples via Context7. Includes agent skills for VS Code and Claude Code. |
| 💬 [discourse-mcp](./external/discourse-mcp/README.md) | `external/discourse-mcp/` | Discourse MCP setup for `community.cesium.com` with read-only and write-enabled configuration examples. |

## 🚀 Getting Started

See the individual READMEs for full details:

- **[cesium-js README](./cesium-js/README.md)** — install, build, run all CesiumJS servers and the web test application
- **[cesium-camera-server README](./cesium-js/servers/camera-server/README.md)** — camera tools reference and configuration
- **[cesium-entity-server README](./cesium-js/servers/entity-server/README.md)** — entity tools reference and configuration
- **[cesium-animation-server README](./cesium-js/servers/animation-server/README.md)** — animation tools reference and configuration
- **[cesium-geolocation-server README](./geolocation-server/README.md)** — geolocation, POI search, and routing tools
- **[mcp-apps README](./mcp-apps/README.md)** — MCP Apps with interactive UIs
- **[cesium-context7 README](./external/cesium-context7/README.md)** — Context7 setup and agent skill usage
- **[discourse-mcp README](./external/discourse-mcp/README.md)** — Discourse MCP setup for community.cesium.com


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
├── geolocation-server/      # Geolocation, POI search, and routing MCP server
├── mcp-apps/                # MCP Apps with interactive UIs
│   ├── codegen/                   # Cesium views code generation
├── external/
│   ├── cesium-context7/         # Context7 external MCP server
│   └── discourse-mcp/           # Discourse external MCP server (community.cesium.com)
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
