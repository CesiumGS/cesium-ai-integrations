import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ICommunicationServer,
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import {
  AnimationTrackEntityInputSchema,
  CameraTrackingResponseSchema,
} from "../schemas/index.js";
import { animations, setTrackedEntityId } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_track_entity tool
 */
export function registerAnimationTrackEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_track_entity",
    {
      title: "Track Entity with Camera",
      description:
        "Make the camera follow an animated entity for an immersive viewing experience",
      inputSchema: AnimationTrackEntityInputSchema.shape,
      outputSchema: CameraTrackingResponseSchema.shape,
    },
    async ({ entityId, range, pitch, heading }) => {
      try {
        // Find animation by entity ID
        const animState = Array.from(animations.values()).find(
          (anim) => anim.entityId === entityId,
        );

        if (!animState) {
          throw new Error(`No animation found for entity ${entityId}`);
        }

        setTrackedEntityId(entityId);

        const command = {
          type: "animation_track_entity",
          entityId,
          range: range ?? 1000,
          pitch: pitch ?? -45,
          heading: heading ?? 0,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Camera now tracking entity ${entityId}`,
            isTracking: true,
            trackedEntityId: entityId,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            ResponseEmoji.Track,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from client");
      } catch (error) {
        return buildErrorResponse(
          0,
          {
            success: false,
            message: `Failed to track entity: ${formatErrorMessage(error)}`,
            isTracking: false,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
