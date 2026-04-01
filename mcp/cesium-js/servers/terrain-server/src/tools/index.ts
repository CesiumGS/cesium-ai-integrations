import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerTerrainSet } from "./terrain-set.js";
import { registerTerrainGet } from "./terrain-get.js";
import { registerTerrainRemove } from "./terrain-remove.js";

/**
 * Register all terrain tools with the MCP server
 */
export function registerTerrainTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Terrain tools require a communication server for browser visualization",
    );
  }

  registerTerrainSet(server, communicationServer);
  registerTerrainGet(server, communicationServer);
  registerTerrainRemove(server, communicationServer);
}
