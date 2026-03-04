# CesiumJS MCP Servers

pnpm monorepo containing Cesium MCP Apps for AI assistants.

## 📦 Packages

| Package                                           | Description                         | Port |
| --------------------------------------------------| ------------------------------------| ---- |
| [`@cesium-mcp-apps/codegen`](./codegen/README.md) | Cesium views code generation        | 3001 |

## 🛠️ MCP Servers

### 🎥 [cesium-camera-server](./servers/camera-server/README.md)

MCP App for generating Cesium views.

| Tool                            | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `codegen`                       | Generate Views from provided description                         |

## 🏗️ Structure

```
cesium-js/
├── servers/
│   ├── codegen/             # @cesium-mcp/codegen
├── package.json             # pnpm workspace root
└── pnpm-workspace.yaml
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
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
pnpm run build              # Build everything
pnpm run build:codegen      # @cesium-mcp-apps/codegen only
pnpm run clean              # Remove all build artifacts
```

## ▶️ Running

### MCP Servers

```bash
pnpm run start:codegen     # Camera server on port 3002
```

### Using with AI Clients

The codegen server works with MCP clients that support MCP Apps like **Claude Desktop**.

MCP App can be tested using [Basic Host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host). Update `SERVERS` environment variable to point to MCP server.

## 🏛️ Architecture

```mermaid
sequenceDiagram
    AI Assistant ->>+ MCP Server: Tool request
    MCP Server -->>- AI Assistant: UI resource uri
    AI Assistant ->>+ MCP Server: Resource request
    MCP Server -->>- AI Assistant: iframe contents
    AI Assistant ->> iframe: Show iframe
    iframe ->>+ MCP Server: Tool request
    MCP Server -->>- iframe: Tool response
    iframe ->>+ External resources: request
    External resources -->>- iframe: response
```

1. **AI assistant** calls MCP tool.
2. **MCP tool** returns associated UI component resource in `_meta.ui.resourceUri`.
3. **AI assistant** downloads associated resource.
4. **AI assistant** shows reource contents as a webpage in **iframe**.
5. **iframe** script calls MCP tool.
6. MCP tool returns result to **iframe**
7. **iframne** renders, external resources and calls can optionally be made.

## 🤝 Contributing

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Apache-2.0 — see [LICENSE](../../LICENSE).