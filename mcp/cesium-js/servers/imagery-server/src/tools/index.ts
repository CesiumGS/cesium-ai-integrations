import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerImageryAdd } from "./imagery-add.js";
import { registerImageryRemove } from "./imagery-remove.js";
import { registerImageryList } from "./imagery-list.js";

/**
 * Register all imagery tools with the MCP server
 * @param server - The MCP server instance
 * @param communicationServer - The communication server for browser interaction
 */
export function registerImageryTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Imagery tools require a communication server for browser visualization",
    );
  }

  // Register all imagery tools
  registerImageryAdd(server, communicationServer);
  registerImageryRemove(server, communicationServer);
  registerImageryList(server, communicationServer);
}
