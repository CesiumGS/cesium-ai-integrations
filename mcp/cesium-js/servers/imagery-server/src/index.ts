#!/usr/bin/env node

import "dotenv/config";
import {
  CesiumMCPServer,
  CesiumSSEServer,
  CesiumWebSocketServer,
} from "@cesium-mcp/shared";
import { registerImageryTools } from "./tools/index.js";

const PORT = parseInt(
  process.env.PORT || process.env.IMAGERY_SERVER_PORT || "3005",
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
        name: "cesium-imagery-mcp-server",
        version: "1.0.0",
        communicationServerPort: PORT,
        communicationServerMaxRetries: MAX_RETRIES,
        communicationServerStrictPort: STRICT_PORT,
        mcpTransport: (process.env.MCP_TRANSPORT || "stdio") as
          | "stdio"
          | "streamable-http",
      },
      communicationServer,
    );

    console.error(
      `Imagery Server starting with ${PROTOCOL.toUpperCase()} on port ${PORT} (strictPort: ${STRICT_PORT})`,
    );

    // Register imagery tools
    server.registerTools(registerImageryTools);

    // Start the server
    await server.start();
  } catch (error) {
    console.error("Failed to start imagery server:", error);
    process.exit(1);
  }
}

// Handle errors
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
