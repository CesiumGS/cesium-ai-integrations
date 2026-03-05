# 🌍 Cesium Entity MCP Server

MCP App for generating Cesium views.

Read more about MCP Apps in https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/.

## Prerequisites

- [OpenAI deployment](https://azure.microsoft.com/en-us/products/ai-foundry/models/openai) with `gpt-5.2-codex` model
- MCP Apps compatible client like [Basic Host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host)

## Configure

Create `.env` file based on `.env.example` and fill required `CESIUM_TOKEN`, `OPENAI_URL` and `OPENAI_KEY` values.
Optionally change `OPENAI_MODEL` if different LLM Model is required.
Change `HOST_URL` to the public domain value if hosting publicly. This is required for [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

## Installation

```bash
pnpm install
pnpm run build
```

## Running the Server

```bash
pnpm start
```

## Tools

### `codegen`

**Generate and execute code from description**

Shows a Cesium viewer generated from provided description.

**Input:**

- `description` Viewer generation request

## Using with AI Clients

The codegen server works with MCP clients that support MCP Apps like **Claude Desktop**.

MCP App can be tested using [Basic Host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host). Set `HOST_URL` value in `SERVERS` environment variable to connect Basic Host to Codegen MCP Server.

## Using code generation directly

An `<iframe>` generated for MCP App can be used directly without MCP infrastructure like embedding in web pages. Just open the `{HOST_URL}/iframe?description={description}` url and put the viewer description in `{description}` query parameter.

## Example Queries

Try these simple commands with your AI client:

```
"Orbit the great pyramid"
"Fly from Chicago to New York"
"Fly from Chicago to New York with plane"
"Cesium man on top of mount Everest"
"Tour of Paris"
"With day night switch"
```

## Contributing

Interested in contributing? Please read [CONTRIBUTING.md](../../../CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](../../../CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](../../../LICENSE).
