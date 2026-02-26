---
name: cesium-mcp-server-creation
description: Comprehensive guide for creating new Cesium MCP servers and integrating them with test applications. Covers server architecture, tool registration, schema validation with Zod, communication protocols (SSE/WebSocket), and client integration patterns. Use when building new MCP servers for Cesium features like entities, animations, imagery, terrain, or other CesiumJS capabilities.
---

# Cesium MCP Server Creation Guide

This skill provides comprehensive guidance for creating Model Context Protocol (MCP) servers for Cesium applications and integrating them with proof-of-concept samples.

## Documentation Structure

This skill is organized into focused guides for different aspects of MCP server development:

### Core Guides

1. **[Tool and Schema Patterns](./tool-and-schema-patterns.md)** - Detailed patterns for creating MCP tools and defining Zod schemas
   - Schema organization and design
   - Tool implementation patterns
   - Response formatting
   - Error handling best practices

2. **[Creating a New MCP Server](./creating-mcp-server.md)** - Complete walkthrough for building a server from scratch
   - Project setup and structure
   - Server initialization
   - Dependencies and configuration
   - Building and testing

3. **[Integrating with Test Applications](./integrating-poc-samples.md)** - Complete guide for connecting servers to the test web app
   - Quick integration checklist
   - Manager creation (templates and examples)
   - CesiumApp configuration
   - Environment setup and testing
   - Advanced communication patterns
   - UI integration and troubleshooting

## When to Use This Skill

Use this skill to:
- Create new Cesium MCP servers for entities, camera, imagery, terrain, or other CesiumJS features
- Add tools and schemas to existing servers
- Integrate MCP servers with the test web application
- Understand the server architecture and reference implementation

## Quick Reference by Task

**I want to create tools and schemas:**
→ See [Tool and Schema Patterns](./tool-and-schema-patterns.md)
- How to define Zod schemas
- Tool implementation patterns
- Response formatting
- Error handling

**I want to create a new MCP server:**
→ See [Creating a New MCP Server](./creating-mcp-server.md)
- Complete server setup
- Project structure
- Dependencies and build configuration
- Testing

**I want to integrate a server with the test application:**
→ See [Integrating with Test Applications](./integrating-poc-samples.md)
- Quick integration checklist
- Manager creation (templates and examples)
- CesiumApp configuration
- Web app `mcpServers` array setup (Step 4)
- Testing and troubleshooting

---

## Quick Start

1. **Create Server**: Follow [Creating a New MCP Server](./creating-mcp-server.md) - covers setup, schemas, tools, and testing
2. **Add Tools**: Use patterns from [Tool and Schema Patterns](./tool-and-schema-patterns.md) for defining schemas and implementing tools  
3. **Integrate**: Follow [Integrating with Test Applications](./integrating-poc-samples.md) - includes manager creation, configuration, and testing
   - Add your manager to the `managers` array in `cesium-app.ts` `initializeControllers()` method
   - Add your server to `mcpServers` array in `web-app/src/app.ts` (Step 4)

Each guide contains complete checklists and step-by-step instructions.

---

## Resources

### Skill Documentation

- **[Tool and Schema Patterns](./tool-and-schema-patterns.md)** - Patterns for creating tools and schemas
- **[Creating a New MCP Server](./creating-mcp-server.md)** - Complete server creation guide
- **[Integrating with Test Applications](./integrating-poc-samples.md)** - Complete integration guide with examples

### Code References

- [Camera Server README](../../mcp/servers/camera-server/README.md) - Reference implementation with complete documentation
- [Shared Package](../../mcp/servers/shared/) - Base classes and utilities
- [Client Core](../../mcp/test-applications/cesium-js/packages/client-core/) - Client library

### External Resources

- [MCP Protocol Specification](https://modelcontextprotocol.io/introduction)
- [Zod Documentation](https://zod.dev/)
- [CesiumJS API](https://cesium.com/learn/cesiumjs/ref-doc/) - Use Context7 skill instead for up-to-date docs

## Getting Help

- **CesiumJS documentation**: Use the **cesium-context7 skill** for up-to-date API docs
- **Architecture patterns**: Review camera-server implementation
- **Integration examples**: Check client-core library and test web app