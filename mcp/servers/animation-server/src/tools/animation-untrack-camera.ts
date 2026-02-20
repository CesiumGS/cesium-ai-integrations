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
  AnimationUntrackCameraInputSchema,
  CameraTrackingResponseSchema,
} from "../schemas/index.js";
import { setTrackedEntityId } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_untrack_camera tool
 */
export function registerAnimationUntrackCamera(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_untrack_camera",
    {
      title: "Untrack Camera",
      description: "Stop camera tracking and return control to user",
      inputSchema: AnimationUntrackCameraInputSchema.shape,
      outputSchema: CameraTrackingResponseSchema.shape,
    },
    async () => {
      try {
        setTrackedEntityId(null);

        const command = {
          type: "animation_untrack_camera",
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: "Camera tracking disabled",
            isTracking: false,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            ResponseEmoji.Success,
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
            message: `Failed to untrack camera: ${formatErrorMessage(error)}`,
            isTracking: false,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
