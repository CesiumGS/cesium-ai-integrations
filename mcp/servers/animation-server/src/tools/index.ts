import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerAnimationCreateFromRoute } from "./animation-create-from-route.js";
import { registerAnimationCreateCustomPath } from "./animation-create-custom-path.js";
import { registerAnimationPlay } from "./animation-play.js";
import { registerAnimationPause } from "./animation-pause.js";
import { registerAnimationUpdateSpeed } from "./animation-update-speed.js";
import { registerAnimationRemove } from "./animation-remove.js";
import { registerAnimationListActive } from "./animation-list-active.js";
import { registerAnimationConfigurePath } from "./animation-configure-path.js";
import { registerAnimationTrackEntity } from "./animation-track-entity.js";
import { registerAnimationUntrackCamera } from "./animation-untrack-camera.js";
import { registerClockConfigure } from "./clock-configure.js";
import { registerClockSetTime } from "./clock-set-time.js";
import { registerClockSetMultiplier } from "./clock-set-multiplier.js";
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
  registerAnimationCreateFromRoute(server, communicationServer);
  registerAnimationCreateCustomPath(server, communicationServer);
  registerAnimationPlay(server, communicationServer);
  registerAnimationPause(server, communicationServer);
  registerAnimationUpdateSpeed(server, communicationServer);
  registerAnimationRemove(server, communicationServer);
  registerAnimationListActive(server, communicationServer);
  registerAnimationConfigurePath(server, communicationServer);
  registerAnimationTrackEntity(server, communicationServer);
  registerAnimationUntrackCamera(server, communicationServer);

  // Register clock control tools
  registerClockConfigure(server, communicationServer);
  registerClockSetTime(server, communicationServer);
  registerClockSetMultiplier(server, communicationServer);
  registerTimelineZoomToRange(server, communicationServer);
  registerGlobeSetLighting(server, communicationServer);
  
  console.error("✅ Registered 15 animation and clock control tools");
}
