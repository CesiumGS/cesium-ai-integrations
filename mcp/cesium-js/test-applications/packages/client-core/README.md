# @cesium-mcp/client-core

Shared core library for Cesium MCP clients. This package contains:

- **Managers**: Cesium feature controllers for camera, entities, animations, and more
- **Communications**: Base, SSE, and WebSocket MCP protocol implementations
- **Utilities**: Cesium helper functions for various operations
- **Types**: TypeScript definitions for MCP protocol and Cesium operations
- **CesiumApp**: Main application class for initializing Cesium with MCP support

## Usage

### Browser Application

```typescript
import { CesiumApp, SSECommunication } from "@cesium-mcp/client-core";

const config = {
  cesiumAccessToken: "your-token",
  mcpServers: [
    /* ... */
  ],
};

const app = new CesiumApp("cesiumContainer", config);
await app.initialize();
```

## Architecture

This package is designed for browser applications and uses HTTP/SSE/WebSocket for MCP communication with localhost servers.

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## 📗 License

Apache 2.0. See [LICENSE](../LICENSE).
