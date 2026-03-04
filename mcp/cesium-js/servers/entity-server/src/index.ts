#!/usr/bin/env node

import "dotenv/config";
import {
  CesiumSSEServer,
  CesiumMCPServer,
  CesiumWebSocketServer,
} from "@cesium-mcp/shared";
import { registerEntityTools } from "./tools/index.js";

// Azure-ready configuration with environment variables
const PORT = parseInt(
  process.env.PORT || process.env.ENTITY_SERVER_PORT || "3003",
);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "10");
const PROTOCOL = process.env.COMMUNICATION_PROTOCOL || "websocket";
const STRICT_PORT = process.env.STRICT_PORT === "true";

// Create communication server based on protocol
const communicationServer =
  PROTOCOL === "sse" ? new CesiumSSEServer() : new CesiumWebSocketServer();

// Create MCP server with configuration
const server = new CesiumMCPServer(
  {
    name: "cesium-entity-mcp-server",
    version: "1.0.0",
    communicationServerPort: PORT,
    communicationServerMaxRetries: MAX_RETRIES,
    communicationServerStrictPort: STRICT_PORT,
  },
  communicationServer,
);

console.error(
  `🚀 Entity Server starting with ${PROTOCOL.toUpperCase()} on port ${PORT} (strictPort: ${STRICT_PORT})`,
);

// Register tools and resources
server.registerTools(registerEntityTools);

// Start server
server.start().catch((error) => {
  console.error("❌ Failed to start entity server:", error);
  process.exit(1);
});
