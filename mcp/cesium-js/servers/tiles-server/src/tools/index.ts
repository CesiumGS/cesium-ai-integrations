import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerTilesetAdd } from "./tiles-add.js";
import { registerTilesetRemove } from "./tiles-remove.js";
import { registerTilesetList } from "./tiles-list.js";
import { registerTilesetStyle } from "./tiles-style.js";

/**
 * Register all 3D Tiles tools with the MCP server
 */
export function registerTilesTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Tiles tools require a communication server for browser visualization",
    );
  }

  registerTilesetAdd(server, communicationServer);
  registerTilesetRemove(server, communicationServer);
  registerTilesetList(server, communicationServer);
  registerTilesetStyle(server, communicationServer);
}
