# Cesium AI Integrations

[Cesium](https://cesium.com/) :earth_asia: [CesiumJS](https://cesium.com/cesiumjs) :earth_americas: [Forum](https://community.cesium.com/) :earth_africa: [Issues](https://github.com/CesiumGS/cesium-ai-integrations/issues)

---

> [!WARNING]
> **This repository is deprecated.** Active development has moved to purpose-built repositories. Please migrate to the resources below.
>
> ### Where to go instead
>
> | What you need | Go here |
> |---|---|
> | Starter app with AI assistant integration (viewer tools for camera control, entity management, 3D Tiles, imagery, and terrain; a code generation tool; plus support for connecting external MCP servers) | [**cesiumjs-ai-starter-app**](https://github.com/CesiumGS/cesiumjs-ai-starter-app) — see the [docs](https://cesiumgs.github.io/cesiumjs-ai-starter-app/) |
> | Code generation and development use cases with agent skills | [**cesiumjs-skills**](https://github.com/CesiumGS/cesiumjs-skills) — see the [tutorials](https://cesium.com/learn/cesiumjs-learn/build-a-cesiumjs-app-with-ai/) |
>
> ### What changed
>
> #### Architecture: WebSocket bridge → Built-in Viewer Tools + WebMCP
>
> This repository exposed CesiumJS viewer capabilities to AI assistants by running a local WebSocket-based MCP server that bridged messages between the AI and the browser. While useful for experimentation, this approach has meaningful limitations for production use: it requires every user to run a separate local server process, ties the session to a single browser tab, and does not scale — there is no clean path to a hosted or multi-user deployment.
>
> The **[cesiumjs-ai-starter-app](https://github.com/CesiumGS/cesiumjs-ai-starter-app)** replaces this pattern with approaches suitable for production, and its [architecture docs](https://cesiumgs.github.io/cesiumjs-ai-starter-app/architectures/architecture/) walk through how to design a production-ready Cesium + AI app:
>
> - **AI SDK tools with built-in chat interface** — CesiumJS viewer capabilities (camera, entities, 3D Tiles, terrain, imagery) and a code generation tool are implemented as [AI SDK](https://sdk.vercel.ai/) tools and shipped alongside a fully integrated chat UI, giving you a deployable production app out of the box. 
> - **External MCP servers support** — connect third-party MCP tool servers into the same agent loop via an optional MCP client bridge, including [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) that render interactive `ui://` widgets returned by those servers
> - **[WebMCP](https://developer.chrome.com/docs/ai/webmcp) (experimental)** — registers the app's viewer tools directly on `document.modelContext` via the browser-native WebMCP Imperative API, so an agent already running in the same browser tab (Chrome's built-in AI, or an extension like the Model Context Tool Inspector) can discover and call tools against the live `Viewer` with no network hop or server process. With an additional bridge (e.g. [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) has `execute_webmcp_tool`, `list_webmcp_tools` tools), these WebMCP tools can also be exposed to external AI providers such as Claude or GitHub Copilot
>
> For **code generation and IDE workflows**, the **[cesiumjs-skills](https://github.com/CesiumGS/cesiumjs-skills)** repository provides agent skills that activate CesiumJS-specific capabilities directly inside AI coding assistants.
>
> This repository will remain available for reference but will not receive further updates.

---

Cesium AI Integrations is a collection of reference integrations, experiments, and patterns that connect the Cesium ecosystem with AI systems such as LLMs, retrieval pipelines, and agent workflows. The goal is to help developers build geospatially aware applications that can reason about 3D data and geospatial context.

Built on open standards, these integrations are designed to be modular, composable, and easy to adapt for real-world products.

## 🚀 Get started

1. Browse the repository folders to find the integration or example relevant to your use case.
2. Follow the setup instructions in each integration's README.
3. Use the examples as a starting point for your own applications and workflows.

## ✅ What's inside

- Reference patterns for connecting Cesium apps to AI assistants and tools
- Approaches for grounding AI responses with geospatial context
- Example workflows for data ingestion, retrieval, and analysis
- Prototypes that demonstrate AI-assisted exploration of 3D geospatial content
### 📂 Repository Structure

- **[mcp/](mcp/README.md)** - Model Context Protocol servers and applications that integrate Cesium with AI assistants
- **[skills/](skills/README.md)** - Agent skills for automatic activation of Cesium-related capabilities in AI assistants

## 📚 Documentation

- Each integration includes its own setup and usage guide.
- For general CesiumJS learning resources, see the [CesiumJS Learn hub](https://cesium.com/learn/cesiumjs-learn/).

## 🌟 Awesome community examples

These community projects are great references for Cesium + AI integrations. **We welcome contributions!** If you've built something cool with Cesium and AI, feel free to open a PR to add your project to this list.

### 🔌 MCP Servers:

- [gaopengbin-cesium-mcp](https://github.com/gaopengbin/cesium-mcp) – A community MCP bridge for CesiumJS that provides tools for camera control, entity management, 3D Tiles, terrain, imagery layers, and more. Supports both local (stdio) and remote (Streamable HTTP) modes.

### 🔌 [MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)

- [Interactive 3D globe map](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/map-server) – Interactive 3D globe viewer using CesiumJS with OpenStreetMap tiles. Demonstrates geocoding integration and full MCP App capabilities.

<details>
<summary>📹 View demo video</summary>

<video src="https://github.com/user-attachments/assets/bfed4125-e17f-4e21-8f6a-0608f226e6db" controls></video>

</details>


## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## 📗 License

Apache 2.0. See [LICENSE](LICENSE).
