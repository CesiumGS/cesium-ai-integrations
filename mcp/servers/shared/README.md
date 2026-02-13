# @cesium-mcp/shared

Shared utilities and infrastructure for Cesium MCP servers.

## Overview

This package provides:

- **CesiumMCPServer**: MCP server wrapper with multiple transport types
- **Communication Servers**: SSE and WebSocket servers for browser/Unity/Unreal visualization
- **Location Resources**: Predefined geographic locations
- **Common Types**: Shared TypeScript interfaces

---

## Quick Start

### With Browser Visualization

```typescript
import { CesiumSSEServer, CesiumMCPServer } from '@cesium-mcp/shared';

const commServer = new CesiumSSEServer();
const server = new CesiumMCPServer(commServer, {
  name: 'my-cesium-server',
  version: '1.0.0',
  communicationServerPort: 3005
});

server.registerTools((mcpServer, commServer) => {
  mcpServer.registerTool('my_tool', ...);
});

await server.start();
```

### MCP-Only (No Visualization)

```typescript
import { CesiumMCPServer } from '@cesium-mcp/shared';

const server = new CesiumMCPServer({
  name: 'my-mcp-server',
  version: '1.0.0'
});

server.registerTools((mcpServer, commServer) => {
  // commServer will be undefined
  mcpServer.registerTool('my_tool', ...);
});

await server.start();
```

**See [TRANSPORT_EXAMPLES.md](./TRANSPORT_EXAMPLES.md) for:**

- HTTP transport examples
- Unity/Desktop integration
- WebSocket vs SSE selection guide
- Testing and debugging

---

## Communication Servers

### CesiumSSEServer

SSE-based server for browser visualization.

**Key Methods:**

```typescript
await sseServer.start({ port: 3002, maxRetries: 10 });
const result = await sseServer.executeCommand(command, 10000);
const stats = sseServer.getStats();
await sseServer.stop();
```

**Endpoints:**

- `GET /mcp/events` - SSE command stream
- `POST /mcp/result` - Command results
- `GET /mcp/health` - Health check

### CesiumWebSocketServer

WebSocket-based server for Unity/Unreal/Desktop apps.

**Use for:**

- Unity/Unreal applications
- Desktop apps (Electron, Tauri, WPF)
- Bidirectional real-time updates

**Connection:**

```typescript
const ws = new WebSocket("ws://localhost:3002/mcp/ws");
ws.onmessage = (event) => {
  const command = JSON.parse(event.data);
  const result = executeCommand(command);
  ws.send(JSON.stringify({ id: command.id, result }));
};
```

### Choosing Server Type

| Client           | Server                | Reason                        |
| ---------------- | --------------------- | ----------------------------- |
| CesiumJS Browser | CesiumSSEServer       | Simple, auto-reconnect        |
| Unity/Unreal     | CesiumWebSocketServer | Bidirectional, native support |
| Desktop Apps     | CesiumWebSocketServer | Full-duplex                   |

**See [TRANSPORT_EXAMPLES.md](./TRANSPORT_EXAMPLES.md) for detailed examples.**

---

## Installation

This package is typically used as a dependency by other Cesium MCP servers:

```bash
pnpm install @cesium-mcp/shared
```

## Usage

### In MCP Servers

```typescript
import { CesiumSSEServer, registerLocationResources } from "@cesium-mcp/shared";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Create SSE server
const sseServer = new CesiumSSEServer();

// Start server with configuration
const actualPort = await sseServer.start({
  port: 3002,
  maxRetries: 10,
  strictPort: false,
});

console.log(`Server started on port ${actualPort}`);

// Register MCP location resources
const mcpServer = new McpServer({
  name: "my-cesium-server",
  version: "1.0.0",
});

registerLocationResources(mcpServer);

// Execute commands
const result = await sseServer.executeCommand({
  type: "camera_fly_to",
  destination: { longitude: 2.2945, latitude: 48.8584, height: 500 },
});

// Clean shutdown
process.on("SIGINT", async () => {
  await sseServer.stop();
  process.exit(0);
});
```

### In Browser (CesiumJS App)

````javascript
// Connect to SSE endpoint
const eventSource = new EventSource('http://localhost:3002/mcp/events');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
---

## Installation

```bash
pnpm install @cesium-mcp/shared
````

## Development

```bash
pnpm run build    # Compile TypeScript
pnpm run dev      # Watch mode
pnpm run clean    # Remove build artifacts
```

<details>
<summary>💡 Why does this codebase use <code>console.error</code> everywhere?</summary>

MCP servers using stdio transport (the default) reserve stdout for JSON-RPC protocol messages. All logging must go to stderr to avoid corrupting the message stream.

```typescript
// ✅ Correct
console.error("Server started");

// ❌ Wrong - breaks MCP protocol
console.log("Server started");
```

</details>

## API Reference

See [TRANSPORT_EXAMPLES.md](./TRANSPORT_EXAMPLES.md) for detailed usage examples.

**Key APIs:**

- `CesiumMCPServer` - MCP server wrapper with transport support
- `CesiumSSEServer` - SSE communication server
- `CesiumWebSocketServer` - WebSocket communication server

**Configuration:**

```typescript
interface MCPServerConfig {
  name: string;
  version: string;
  communicationServerPort?: number;
  mcpTransport?: "stdio" | "sse" | "streamable-http";
  mcpTransportEndpoint?: string;
}
```
