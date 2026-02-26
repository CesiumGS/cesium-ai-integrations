# Integrating MCP Servers with PoC Samples

This guide explains how to integrate a new Cesium MCP server with the CesiumJS PoC web application. It provides both a **streamlined checklist** for quick integration and **step-by-step instructions** with placeholder examples.

## Table of Contents

- [Quick Integration Checklist](#quick-integration-checklist)
- [Architecture Overview](#architecture-overview)
- [Detailed Integration Steps](#detailed-integration-steps)
- [Testing](#testing-the-integration)
- [Troubleshooting](#troubleshooting)
- [Advanced Patterns](#advanced-integration-patterns)

---

## Quick Integration Checklist

For experienced developers, here's a quick checklist:

### Prerequisites
- ✅ Completed MCP server implementation
- ✅ Server compiles and runs without errors
- ✅ Tools and schemas are properly defined
- ✅ PoC web application exists at `mcp/PoC/CesiumJs/`

### Integration Steps
1. ☐ Create manager in `client-core/src/managers/[feature]-manager.ts`
2. ☐ Register manager in `CesiumApp.initializeControllers()` managers array
3. ☐ Export manager from `client-core/src/index.ts`
4. ☐ Add server to `mcpServers` array in `web-app/src/app.ts`
5. ☐ Update environment variables (`.env` files)
6. ☐ Build: `pnpm run build` in client-core and web-app
7. ☐ Test: Start servers and verify connection

**See [Detailed Integration Steps](#detailed-integration-steps) below for complete instructions.**

---

## Architecture Overview

The PoC application has a three-layer architecture:

```
Browser (web-app)
    ↕ HTTP/WebSocket/SSE
Client Library (client-core)
    ↕ MCP Protocol
MCP Server ([feature]-server)
```

**Key Components:**

- **CesiumApp**: Main application class that initializes Cesium and manages connections
- **Managers**: Feature-specific controllers (e.g., CameraManager, etc.)
- **CommunicationManagers**: Protocol handlers (SSE, WebSocket)
- **MCP Servers**: Backend servers providing tools

## Prerequisites

- Completed MCP server from [Creating a New MCP Server](./creating-mcp-server.md)
- PoC web application set up at `mcp/PoC/CesiumJs/`
- Server running and accessible on a specific port

---

## Detailed Integration Steps

Follow these steps to integrate your MCP server with the PoC application.

## Step 1: Create a Manager in client-core

**Location**: `mcp/PoC/CesiumJs/packages/client-core/src/managers/[feature]-manager.ts`

Managers handle domain-specific operations and communication with MCP servers.

### Manager Structure

```typescript
import type { CesiumViewer } from "../types/cesium-types.js";
import type {
  ManagerInterface,
  CommandHandler,
  MCPCommandResult,
} from "../types/mcp.js";

class Cesium[Feature]Manager implements ManagerInterface {
  viewer: CesiumViewer;
  prefix: string;
  handlers: Map<string, CommandHandler>;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
    this.prefix = "[feature]";
    this.handlers = new Map();
  }

  /**
   * Setup method called during initialization
   */
  setUp(): void {
    console.log("[Feature]Manager initialized");
  }

  /**
   * Get command handlers for this manager
   * Note: This method must exist for commands to be registered
   */
  getCommandHandlers(): Map<string, CommandHandler> {
    // Register handlers for each command type
    this.handlers.set("[feature]_action", async (cmd) => {
      return await this.handleAction(cmd);
    });

    return this.handlers;
  }

  /**
   * Handle a specific action
   */
  private async handleAction(
    command: Record<string, unknown>,
  ): Promise<MCPCommandResult> {
    try {
      // Execute Cesium operation
      // ...

      return {
        success: true,
        message: "Action completed successfully",
        data: { /* result data */ },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cleanup resources
   */
  shutdown(): void {
    console.log("[Feature]Manager shutting down");
    this.handlers.clear();
  }
}

export default Cesium[Feature]Manager;
```

**Key Implementation Points:**
- Implement `getCommandHandlers()` - this is how the communication system discovers commands
- Register command handlers in `getCommandHandlers()` using `this.handlers.set(commandType, handler)`
- Command types should match what your MCP server sends (e.g., `"feature_action"`)
- Return `MCPCommandResult` with `success`, `message`, and optional `data`
- Implement `setUp()` for initialization and `shutdown()` for cleanup
- Use Cesium utilities from shared helpers for common operations

## Step 2: Register Manager in CesiumApp

Update `mcp/PoC/CesiumJs/packages/client-core/src/cesium-app.ts`:

### 1. Import the Manager

```typescript
// Add import at the top of the file
import Cesium[Feature]Manager from "./managers/[feature]-manager.js";
```

### 2. Add Manager to the managers Array

Locate the `initializeControllers()` method and add your manager to the array:

```typescript
  initializeControllers(): void {
    if (!this.viewer) {
      return;
    }

    this.managers = [
      new CesiumCameraController(this.viewer),
      new Cesium[Feature]Manager(this.viewer), // Add your manager here
    ];
  }
```

**How It Works:**
- The `managers` array is passed to communication managers during initialization
- Communication managers call `getCommandHandlers()` on each manager to collect command handlers
- Managers not in this array will have their handlers unregistered, resulting in unknown command errors
```

## Step 3: Export Manager from client-core

Update `mcp/PoC/CesiumJs/packages/client-core/src/index.ts`:

```typescript
// Add to exports
export { default as Cesium[Feature]Manager } from "./managers/[feature]-manager.js";

// Export types
export type { [FeatureType]Options } from "./managers/[feature]-manager.js";
```

## Step 4: Update Web App Configuration

**Location**: `mcp/PoC/CesiumJs/web-app/src/app.ts`

Add your new server to the `mcpServers` array:

```typescript
import { CesiumApp, type CesiumAppConfig } from "@cesium-mcp/client-core";

// Build configuration from environment variables
const config: CesiumAppConfig = {
  cesiumAccessToken:
    process.env.CESIUM_ACCESS_TOKEN || "your_access_token_here",
  mcpProtocol: (process.env.MCP_PROTOCOL || "websocket") as "sse" | "websocket",
  mcpServers: [
    {
      name: "Camera Server",
      port: parseInt(process.env.MCP_CAMERA_PORT || "3002"),
    },
    {
      name: "[Feature] Server",
      port: parseInt(process.env.MCP_[FEATURE]_PORT || "3003"),
    },
  ],
};

// ... rest of app initialization
```

**Key Points:**
- Each server needs a unique `name` and `port`
- Port should match the port your MCP server listens on
- Use environment variables for flexibility (`MCP_[FEATURE]_PORT`)
- The server name will appear in the web UI status panel

## Step 5: Configure Environment Variables

### Server Configuration

**Location**: `mcp/.env` (create if doesn't exist)

```bash
# [Feature] Server Configuration
[FEATURE]_SERVER_PORT=3003
COMMUNICATION_PROTOCOL=websocket
STRICT_PORT=true
MCP_TRANSPORT=stdio
```

### Client Configuration

Update `mcp/PoC/CesiumJs/web-app/.env`:

```bash
# Cesium Configuration
CESIUM_ACCESS_TOKEN=your_cesium_token_here

# MCP Configuration
MCP_PROTOCOL=websocket

# MCP Server Ports
MCP_CAMERA_PORT=3002
MCP_[FEATURE]_PORT=3003
```

## Step 7: Build and Test

### Build Configuration (Optional)

If using environment variable injection, update `web-app/esbuild.config.cjs`:

```javascript
const dotenv = require("dotenv");
const esbuild = require("esbuild");

dotenv.config();

esbuild.build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  outfile: "dist/app.js",
  platform: "browser",
  target: "es2020",
  define: {
    "process.env.CESIUM_ACCESS_TOKEN": JSON.stringify(process.env.CESIUM_ACCESS_TOKEN),
    "process.env.MCP_PROTOCOL": JSON.stringify(process.env.MCP_PROTOCOL),
    "process.env.MCP_[FEATURE]_PORT": JSON.stringify(process.env.MCP_[FEATURE]_PORT),
  },
});
```

### Build Packages

```bash
# From mcp root
pnpm install
cd PoC/CesiumJs/packages/client-core && pnpm run build
cd ../../web-app && pnpm run build
```

### Start and Test

Open separate terminals:

```bash
# Terminal 1: Your server
cd mcp/servers/[feature]-server
pnpm run dev

# Terminal 2: Web application
cd mcp/PoC/CesiumJs/web-app
pnpm run serve:dev
```

### Verify Connection

1. Open browser to `http://localhost:8080`
2. Check status panel shows green indicator (🟢)
3. Check browser console for connection messages

## Step 8: Test with MCP Client

### Configure Claude Desktop

**Claude Desktop config (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "cesium-[feature]": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/mcp/servers/[feature]-server/build/index.js"
      ],
      "env": {
        "[FEATURE]_SERVER_PORT": "3003",
        "COMMUNICATION_PROTOCOL": "websocket"
      }
    }
  }
}
```

### Test

Prompt example:
```
Call your MCP tool with appropriate parameters
```

Start the web application:
```bash
cd mcp/PoC/CesiumJs/web-app
pnpm run serve:dev
```

### Verify Connection

1. Open browser to `http://localhost:8080`
2. Check status panel - Your server should show as connected (🟢)
3. Open browser console - should see connection messages

### Test in Claude Desktop (or other MCP client)

Configure your MCP client to use your server:

**Claude Desktop config (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "cesium-[feature]": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/mcp/servers/[feature]-server/build/index.js"
      ],
      "env": {
        "[FEATURE]_SERVER_PORT": "3003",
        "COMMUNICATION_PROTOCOL": "websocket"
      }
    }
  }
}
```

Test with a prompt:

```
Call your MCP tool with appropriate parameters
```

## Step 9: Add UI Controls (Optional)

Add UI controls to test operations directly from the web app.

Update `web-app/index.html`:

```html
<div id="[feature]Controls" class="controls-panel">
  <h3>[Feature] Controls</h3>
  <button id="createSample[Feature]">Create Sample [Feature]</button>
  <button id="clear[Features]">Clear All [Features]</button>
</div>
```

Update `web-app/src/app.ts`:

```typescript
function initialize[Feature]Controls(): void {
  const createBtn = document.getElementById("createSample[Feature]");
  const clearBtn = document.getElementById("clear[Features]");

  if (createBtn && cesiumApp) {
    createBtn.addEventListener("click", async () => {
      const [feature]Manager = cesiumApp?.get[Feature]Manager();
      if ([feature]Manager) {
        await [feature]Manager.create[FeatureType]({
          id: `${Date.now()}`,
          // Add your feature creation parameters
        });
      }
    });
  }

  if (clearBtn && cesiumApp) {
    clearBtn.addEventListener("click", () => {
      // Add your clear logic
      cesiumApp?.getViewer()?.entities.removeAll();
    });
  }
}
```
function initializeUI(): void {
  // ... existing code
  initialize[Feature]Controls();
}
```

## Communication Flow

Understanding how commands flow through the system:

### MCP Tool Call → Browser

```
1. AI/User → MCP Client (Claude Desktop)
2. MCP Client → [feature]-server (stdio/http)
3. [feature]-server → WebSocket/SSE broadcast
4. Browser receives message
5. CommunicationManager routes to [Feature]Manager
6. [Feature]Manager executes Cesium operation
7. [Feature]Manager sends result back
8. [feature]-server returns to MCP Client
```

### Programmatic Call (from browser)

```
1. UI Button Click
2. app.ts calls [feature]Manager.create[FeatureType]()
3. [Feature]Manager directly manipulates Cesium viewer
4. No MCP server involvement
```

## Advanced Integration Patterns

### 1. Bidirectional State Sync

Keep server informed of entity changes:

```typescript
// In [Feature]Manager
private notifyServerOfChange([feature]Id: string, change: any): void {
  this.communicationManager.send({
    type: "[feature]_changed",
    [feature]Id,
    change,
  });
}
```

### 2. Query Handlers

Allow server to query current state:

```typescript
private setupCommandHandlers(): void {
  this.communicationManager.registerHandler(
    "[feature]_query",
    this.handleQuery.bind(this),
  );
}

private async handleQuery(command: MCPCommand): Promise<MCPCommandResult> {
  const [feature] = this.viewer.[features].getById(command.id);
  if ([feature]) {
    return {
      success: true,
      data: {
        id: [feature].id,
        name: [feature].name,
        show: [feature].show,
        // Add relevant properties
      },
    };
  }
  return {
    success: false,
    error: "[Feature] not found",
  };
}
```

### 3. Batch Operations

Process multiple entities efficiently:

```typescript
public async createMultiple[Features](
  [features]: Create[Feature]Options[],
): Promise<[Feature][]> {
  const created: [Feature][] = [];
  
  for (const options of [features]) {
    const [feature] = await this.create[Feature](options);
    created.push([feature]);
  }
  
  return created;
}
```

## Troubleshooting

### Connection Issues

**Problem**: Status panel shows your server as disconnected (🔴)

**Solutions**:
1. Verify server is running: `cd servers/entity-server && pnpm run dev`
2. Check port matches configuration (default: 3003)
3. Look for errors in server console
4. Check browser console for WebSocket/SSE errors
5. Verify `COMMUNICATION_PROTOCOL` matches on both server and client

### Command Not Executing

**Problem**: Tool call doesn't create entity in viewer

**Solutions**:
1. Check handler is registered in `setupCommandHandlers()`
2. Verify command type matches: `"[feature]_[action]_[target]"`
3. Add console.log in handler to confirm it's being called
4. Check for errors in browser console
5. Verify Cesium viewer is initialized

### Unknown Command Type Error

**Problem**: `❌ Failed to add [feature]: Unknown command type: [feature]_action (0ms)`

**Root Cause**: Manager exists but wasn't added to the `managers` array in `CesiumApp.initializeControllers()`

**Solution**:
1. Open `client-core/src/cesium-app.ts`
2. Find `initializeControllers()` method
3. Add your manager to the array:
   ```typescript
   this.managers = [
     new CesiumCameraController(this.viewer),
     new Cesium[Feature]Manager(this.viewer), // Add this line
   ];
   ```
4. Rebuild client-core: `pnpm run build`

**Why this happens**: The communication system collects command handlers by calling `getCommandHandlers()` on each manager in the `managers` array. If your manager isn't in the array, its handlers are never registered, resulting in "unknown command" errors.

### Build Errors

**Problem**: TypeScript compilation fails

**Solutions**:
1. Rebuild client-core first: `cd packages/client-core && pnpm run build`
2. Check all imports use `.js` extensions
3. Verify types are exported from index.ts
4. Run `pnpm install` in case dependencies are missing

### Environment Variables Not Loading

**Problem**: Server port or token undefined

**Solutions**:
1. Verify `.env` file exists in `web-app/`
2. Check `esbuild.config.cjs` includes variable in `define`
3. Rebuild web-app after changing .env
4. Use `process.env.VARIABLE_NAME` syntax exactly

## Testing Checklist

- [ ] Server starts without errors
- [ ] Web app loads Cesium viewer
- [ ] Status panel shows server as connected (🟢)
- [ ] Console shows "Connected to [Feature] Server"
- [ ] MCP tool call creates [feature] in viewer
- [ ] [Feature] appears at correct location
- [ ] [Feature] has correct appearance
- [ ] Multiple [features] can be created
- [ ] [Features] can be removed
- [ ] Error handling displays appropriate messages

## Performance Considerations

### Connection Pooling

Each server gets its own communication manager:

```typescript
// In CesiumApp
private communicationManagers: Map<string, BaseCommunicationManager> = new Map();

private getOrCreateManager(serverName: string): BaseCommunicationManager {
  if (!this.communicationManagers.has(serverName)) {
    const config = this.findServerConfig(serverName);
    const manager = this.createCommunicationManager(config);
    this.communicationManagers.set(serverName, manager);
  }
  return this.communicationManagers.get(serverName)!;
}
```

### Throttling Updates

For high-frequency operations:

```typescript
private updateThrottle = 100; // ms
private lastUpdate = 0;

private throttledUpdate(): void {
  const now = Date.now();
  if (now - this.lastUpdate > this.updateThrottle) {
    this.performUpdate();
    this.lastUpdate = now;
  }
}
```

### Cleanup

Always cleanup on app shutdown:

```typescript
public async shutdown(): Promise<void> {
  this.entityManager?.cleanup();
  this.cameraManager?.cleanup();
  
  for (const manager of this.communicationManagers) {
    await manager.disconnect();
  }
}
```

---

## Complete Integration Checklist

Use this checklist to ensure complete integration:

### Client-side (client-core)
- [ ] Manager created in `src/managers/[feature]-manager.ts`
- [ ] Manager implements `ManagerInterface`
- [ ] Command handlers registered with `communicationManager`
- [ ] Public API methods implemented (if needed)
- [ ] Cleanup method implemented
- [ ] Manager exported from `src/index.ts`
- [ ] Types exported from `src/index.ts` (if applicable)
- [ ] Built successfully (`pnpm run build`)

### CesiumApp Integration
- [ ] Manager imported in `cesium-app.ts`
- [ ] Manager property added to class
- [ ] Manager initialized in `initializeManagers()`
- [ ] Getter method added
- [ ] Server config includes correct name and port

### Web App Configuration
- [ ] Server added to `mcpServers` array in `app.ts`
- [ ] Server name and port are correct
- [ ] Environment variable for port added to `.env`
- [ ] Environment variable added to `.env.example` (for documentation)
- [ ] Build config updated with new env var (if using injection)
- [ ] Built successfully (`pnpm run build`)

### Server Configuration
- [ ] Server environment variables set in `mcp/.env`
- [ ] Protocol matches client (WebSocket/SSE)
- [ ] Port matches client configuration
- [ ] Server builds successfully
- [ ] Server runs without errors

### Testing
- [ ] Server starts and listens on correct port
- [ ] Web app connects to server (🟢 in status)
- [ ] Console shows connection messages
- [ ] Tool call from MCP client executes successfully
- [ ] Cesium viewer reflects changes
- [ ] No errors in browser or server console

---

## Next Steps

1. **Add More Entity Types**: Implement billboard, label, model, polygon managers
2. **Add Selection**: Enable clicking entities to select/modify them
3. **Add Persistence**: Save/load entity configurations
4. **Add Animation**: Implement entity movement and property animations
5. **Add Clustering**: Group nearby entities for better performance
6. **Add Filtering**: Show/hide entities by category or property

## Resources

- Review existing manager implementations in `client-core/src/managers/` for patterns
- Check `CesiumApp` class for initialization and lifecycle patterns
- Examine communication managers in `client-core/src/communications/` for protocol handling
- [CesiumJS API Documentation](https://cesium.com/learn/cesiumjs/ref-doc/)