#!/usr/bin/env node

import "dotenv/config";
import {
  CesiumMCPServer,
  CesiumSSEServer,
  CesiumWebSocketServer,
} from "@cesium-mcp/shared";
import { registerCameraTools } from "./tools/camera-tools.js";

// Azure-ready configuration with environment variables
const PORT = parseInt(
  process.env.PORT || process.env.CAMERA_SERVER_PORT || "3002",
);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "10");
const PROTOCOL = process.env.COMMUNICATION_PROTOCOL || "websocket";
const STRICT_PORT = process.env.STRICT_PORT === "true";

// Main execution
async function main() {
  try {
    // Create communication server based on protocol
    const communicationServer =
      PROTOCOL === "sse" ? new CesiumSSEServer() : new CesiumWebSocketServer();

    // Create generic MCP server
    const server = new CesiumMCPServer(
      {
        name: "cesium-camera-mcp-server",
        version: "1.0.0",
        communicationServerPort: PORT,
        communicationServerMaxRetries: MAX_RETRIES,
        communicationServerStrictPort: STRICT_PORT,
      },
      communicationServer,
    );

    console.error(
      `🚀 Camera Server starting with ${PROTOCOL.toUpperCase()} on port ${PORT} (strictPort: ${STRICT_PORT})`,
    );

    // Register camera tools
    server.registerTools(registerCameraTools);

    // Start the server
    await server.start();
  } catch (error) {
    console.error("❌ Failed to start camera server:", error);
    process.exit(1);
  }
}

// Handle errors
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
