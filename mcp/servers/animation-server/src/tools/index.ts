import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerAnimationCreate } from "./animation-create.js";
import { registerAnimationControl } from "./animation-control.js";
import { registerAnimationRemove } from "./animation-remove.js";
import { registerAnimationListActive } from "./animation-list-active.js";
import { registerAnimationUpdatePath } from "./animation-update-path.js";
import { registerAnimationCameraTracking } from "./animation-camera-tracking.js";
import { registerClockControl } from "./clock-control.js";
import { registerTimelineZoomToRange } from "./timeline-zoom-to-range.js";
import { registerGlobeSetLighting } from "./globe-set-lighting.js";

/**
 * Register all animation tools with the MCP server
 * @param server - The MCP server instance
 * @param communicationServer - The communication server for browser interaction
 */
export function registerAllAnimationTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Animation tools require a communication server for browser visualization",
    );
  }

  // Register all animation tools
  registerAnimationCreate(server, communicationServer);
  registerAnimationControl(server, communicationServer);
  registerAnimationRemove(server, communicationServer);
  registerAnimationListActive(server, communicationServer);
  registerAnimationUpdatePath(server, communicationServer);
  registerAnimationCameraTracking(server, communicationServer);

  // Register clock and scene control tools
  registerClockControl(server, communicationServer);
  registerTimelineZoomToRange(server, communicationServer);
  registerGlobeSetLighting(server, communicationServer);
  
  console.error("✅ Registered 9 animation and clock control tools (including unified animation_create)");
}
