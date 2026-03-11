#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGeolocationTools } from "./tools/index.js";

async function main() {
  try {
    const server = new McpServer({
      name: "cesium-geolocation-mcp-server",
      version: "1.0.0",
    });

    console.error(`🚀 Geolocation Server starting`);

    registerGeolocationTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("cesium-geolocation-mcp-server started successfully");
  } catch (error) {
    console.error("❌ Failed to start geolocation server:", error);
    process.exit(1);
  }
}

main();
