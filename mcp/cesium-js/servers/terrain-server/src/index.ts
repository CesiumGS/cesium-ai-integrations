#!/usr/bin/env node

import "dotenv/config";
import {
  CesiumMCPServer,
  CesiumSSEServer,
  CesiumWebSocketServer,
} from "@cesium-mcp/shared";
import { registerTerrainTools } from "./tools/index.js";

const PORT = parseInt(
  process.env.PORT || process.env.TERRAIN_SERVER_PORT || "3007",
);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "10");
const PROTOCOL = process.env.COMMUNICATION_PROTOCOL || "websocket";
const STRICT_PORT = process.env.STRICT_PORT === "true";

async function main() {
  try {
    const communicationServer =
      PROTOCOL === "sse" ? new CesiumSSEServer() : new CesiumWebSocketServer();

    const server = new CesiumMCPServer(
      {
        name: "cesium-terrain-mcp-server",
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
      `Terrain Server starting with ${PROTOCOL.toUpperCase()} on port ${PORT} (strictPort: ${STRICT_PORT})`,
    );

    server.registerTools(registerTerrainTools);

    await server.start();
  } catch (error) {
    console.error("Failed to start terrain server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
