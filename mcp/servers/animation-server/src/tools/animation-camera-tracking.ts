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
  CameraTrackingResponseSchema,
  AnimationCameraTrackingInputSchema,
} from "../schemas/index.js";
import { DEFAULT_TIMEOUT_MS } from "../utils/constants.js";

/**
 * Register animation_camera_tracking tool
 */
export function registerAnimationCameraTracking(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_camera_tracking",
    {
      title: "Control Camera Tracking",
      description:
        "Make the camera follow an animated entity or stop tracking to return control to user",
      inputSchema: AnimationCameraTrackingInputSchema.shape,
      outputSchema: CameraTrackingResponseSchema.shape,
    },
    async ({ track, animationId, range, pitch, heading }) => {
      try {
        // Validate animationId when tracking
        if (!animationId) {
          throw new Error("animationId is required");
        }

        // Build command (animationId is also the entity ID in the client)
        const command = track
          ? {
              type: "animation_camera_tracking" as const,
              animationId: animationId,
              range: range ?? 1000,
              pitch: pitch ?? -45,
              heading: heading ?? 0,
              track: true,
            }
          : {
              type: "animation_camera_tracking" as const,
              track: false,
              animationId: animationId,
            };

        // Execute command
        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (!result.success) {
          throw new Error(result.error || "Unknown error from client");
        }

        // Build response
        const output = track
          ? {
              success: true,
              message: `Camera now tracking animation ${animationId}`,
              isTracking: true,
              trackedAnimationId: animationId!,
              stats: { responseTime },
            }
          : {
              success: true,
              message: "Camera tracking disabled",
              isTracking: false,
              stats: { responseTime },
            };

        return buildSuccessResponse(
          track ? ResponseEmoji.Track : ResponseEmoji.Success,
          responseTime,
          output,
        );
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Failed to control camera tracking: ${formatErrorMessage(error)}`,
          isTracking: false,
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
