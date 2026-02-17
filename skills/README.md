# 🌍 Cesium Agent Skills

A collection of [Agent Skills](https://agentskills.io/) specifically designed for working with Cesium ecosystem.

## 🤖 What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that AI agents can discover and use to perform tasks more accurately and efficiently. They provide agents with:

- **Domain expertise**: Specialized knowledge about the Cesium ecosystem, including CesiumJS, Cesium ion, 3D Tiles, and geospatial concepts
- **Procedural knowledge**: Step-by-step instructions for common Cesium platform tasks and workflows
- **Context-aware guidance**: Company-, team-, and project-specific information about working with Cesium technologies

The Agent Skills format is an open standard originally developed by Anthropic and adopted by leading AI development tools including VS Code, GitHub Copilot, and many others.

## 💡 Why Cesium Agent Skills?

The Cesium platform provides powerful tools for 3D geospatial visualization and data management, including CesiumJS, Cesium ion, 3D Tiles, and related technologies. These skills help AI agents:

- Understand Cesium platform terminology and concepts (CesiumJS APIs, 3D Tiles, Cesium ion, CZML, terrain, imagery, etc.)
- Navigate documentation across the Cesium ecosystem effectively
- Follow Cesium best practices for performance, data optimization, and visual quality
- Implement common patterns across CesiumJS development, ion asset management, and 3D Tiles workflows
- Troubleshoot platform-specific issues and integrate Cesium technologies effectively

## 📚 Available Skills

This directory contains Cesium ecosystem agent skills:

- **[cesium-context7](./cesium-context7/)**: Comprehensive knowledge of the Cesium platform, including CesiumJS APIs, Cesium ion workflows, 3D Tiles optimization, and best practices for building 3D geospatial applications. Use this skill to prevent hallucinations and ensure accurate Cesium-specific guidance.

- **[cesium-mcp-server-creation](./cesium-mcp-server-creation/)**: Complete guide for creating new Model Context Protocol (MCP) servers for Cesium applications. Covers server architecture, tool registration, schema validation with Zod, communication protocols (SSE/WebSocket), client integration patterns, and PoC sample integration. Essential for extending the Cesium MCP ecosystem with new features like entities, animations, imagery, terrain, or custom CesiumJS capabilities.

## 🚀 Using These Skills

If you're using an AI assistant that supports Agent Skills (like GitHub Copilot in VS Code), these skills will be automatically discovered and used when working on Cesium-related tasks in this workspace.

Skills are typically stored as `SKILL.md` files within their respective directories, along with any supporting resources.

## 🤝 Contributing New Skills

To add a new Cesium agent skill:

1. Create a new directory under `skills/` with a descriptive name
2. Create a `SKILL.md` file following the [Agent Skills specification](https://agentskills.io/specification)
3. Include any supporting resources (examples, documentation, scripts)
4. Update this README to list the new skill


## 🔗 Resources

- [Agent Skills Homepage](https://agentskills.io/)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Example Skills Repository](https://github.com/anthropics/skills)
- [Cesium Documentation](https://cesium.com/docs/)
- [Cesium ion](https://cesium.com/platform/cesium-ion/)
- [3D Tiles Specification](https://github.com/CesiumGS/3d-tiles)

## 📄 License

See the [LICENSE](../LICENSE) file in the root of this repository.
