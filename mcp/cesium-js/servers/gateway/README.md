# Cesium Gateway MCP Server

A unified MCP server that aggregates all Cesium domain servers (camera, entity, animation, imagery, tiles, terrain) into a single endpoint with dynamic domain management.

## Features

- **Single endpoint** — one MCP server exposes all domain tools
- **Domain filtering** — enable only the domains you need via `CESIUM_DOMAINS`
- **Runtime control** — dynamically enable/disable domains with discovery tools
- **Shared communication** — all domains share one WebSocket/SSE connection to the browser

## Quick Start

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run
pnpm start
```

## Configuration

| Variable                 | Default     | Description                               |
| ------------------------ | ----------- | ----------------------------------------- |
| `PORT`                   | `3010`      | Communication server port                 |
| `CESIUM_DOMAINS`         | _(all)_     | Comma-separated list of domains to enable |
| `COMMUNICATION_PROTOCOL` | `websocket` | `websocket` or `sse`                      |
| `MCP_TRANSPORT`          | `stdio`     | `stdio` or `streamable-http`              |
| `MAX_RETRIES`            | `10`        | Max retries for communication server port |
| `STRICT_PORT`            | `false`     | Fail if port is already in use            |

### Domain Selection

```bash
# Enable all domains (default)
CESIUM_DOMAINS=

# Enable only camera and entity
CESIUM_DOMAINS=camera,entity

# Available domains: camera, entity, animation, imagery, tiles, terrain
```

## MCP Client Configuration

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "cesium-gateway": {
      "command": "node",
      "args": ["path/to/servers/gateway/build/index.js"],
      "env": {
        "PORT": "3010",
        "CESIUM_DOMAINS": "camera,entity,animation,imagery,tiles,terrain"
      }
    }
  }
}
```

## Discovery Tools

The gateway exposes three meta-tools for runtime domain management:

| Tool                    | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `cesium_list_domains`   | List all domains with enabled/disabled status and tool counts |
| `cesium_enable_domain`  | Enable a previously disabled domain                           |
| `cesium_disable_domain` | Disable a domain, hiding its tools                            |

These tools use the MCP SDK's `RegisteredTool.enable()`/`disable()` API, so clients that support `tools/list_changed` notifications will see the tool list update in real time.

## Architecture

```
MCP Client
    │
    ▼
┌──────────────────────────────┐
│     Gateway MCP Server       │
│  ┌────────────────────────┐  │
│  │   DomainRegistry       │  │
│  │  ┌──────┐ ┌──────┐    │  │
│  │  │camera│ │entity│ .. │  │
│  │  └──────┘ └──────┘    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │   Discovery Tools      │  │
│  └────────────────────────┘  │
└──────────────┬───────────────┘
               │ WebSocket/SSE
               ▼
         CesiumJS App
```
