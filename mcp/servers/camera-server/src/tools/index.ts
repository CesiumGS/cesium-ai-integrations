import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerCameraFlyTo } from "./camera-fly-to.js";
import { registerCameraSetView } from "./camera-set-view.js";
import { registerCameraLookAtTransform } from "./camera-look-at-transform.js";
import { registerCameraStartOrbit } from "./camera-start-orbit.js";
import { registerCameraStopOrbit } from "./camera-stop-orbit.js";
import { registerCameraGetPosition } from "./camera-get-position.js";
import { registerCameraSetControllerOptions } from "./camera-set-controller-options.js";

/**
 * Register all camera tools with the MCP server
 * @param server - The MCP server instance
 * @param communicationServer - The communication server for browser interaction
 */
export function registerCameraTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Camera tools require a communication server for browser visualization",
    );
  }

  // Register all camera tools
  registerCameraFlyTo(server, communicationServer);
  registerCameraSetView(server, communicationServer);
  registerCameraLookAtTransform(server, communicationServer);
  registerCameraStartOrbit(server, communicationServer);
  registerCameraStopOrbit(server, communicationServer);
  registerCameraGetPosition(server, communicationServer);
  registerCameraSetControllerOptions(server, communicationServer);
}
