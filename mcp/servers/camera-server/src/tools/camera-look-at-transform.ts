import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import {
  CameraLookAtTransformInputSchema,
  CameraLookAtTransformResponseSchema,
} from "../schemas/index.js";
import { DEFAULT_LOOK_AT_OFFSET, ResponseEmoji } from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "../utils/utils.js";

export function registerCameraLookAtTransform(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_look_at_transform",
    {
      title: "Look At Transform",
      description:
        "Lock the camera to look at a specific point on Earth, useful for orbiting around landmarks",
      inputSchema: CameraLookAtTransformInputSchema.shape,
      outputSchema: CameraLookAtTransformResponseSchema.shape,
    },
    async ({ target, offset }) => {
      try {
        const finalOffset = offset || DEFAULT_LOOK_AT_OFFSET;

        const command = {
          type: "camera_look_at_transform",
          target,
          offset: finalOffset,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Camera locked to look at ${target.latitude}°, ${target.longitude}° from ${finalOffset.range}m distance`,
            target,
            offset: finalOffset,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Success,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to set look at transform: ${formatErrorMessage(error)}`,
          target,
          offset: offset || DEFAULT_LOOK_AT_OFFSET,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
