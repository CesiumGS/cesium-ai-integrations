import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CameraFlyToInputSchema,
  CameraFlyToResponseSchema,
} from "../schemas/index.js";
import {
  DEFAULT_ORIENTATION,
} from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  TIMEOUT_BUFFER_MS,
  ResponseEmoji,
  ICommunicationServer
} from "@cesium-mcp/shared";

export function registerCameraFlyTo(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_fly_to",
    {
      title: "Fly Camera To Position",
      description:
        "Execute camera fly operation with advanced options like easing functions and callbacks",
      inputSchema: CameraFlyToInputSchema.shape,
      outputSchema: CameraFlyToResponseSchema.shape,
    },
    async ({
      destination,
      orientation,
      duration = 3,
      easingFunction,
      maximumHeight,
      pitchAdjustHeight,
      flyOverLongitude,
      flyOverLongitudeWeight,
    }) => {
      try {
        const finalOrientation = orientation || DEFAULT_ORIENTATION;

        // Enhanced command with advanced options
        const command = {
          type: "camera_fly_to",
          destination,
          orientation: finalOrientation,
          duration,
          easingFunction,
          maximumHeight,
          pitchAdjustHeight,
          flyOverLongitude,
          flyOverLongitudeWeight,
        };

        // Calculate timeout based on animation duration + buffer for network latency
        const timeoutMs = duration * 1000 + TIMEOUT_BUFFER_MS;

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          timeoutMs,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Camera flew to ${destination.latitude}°, ${destination.longitude}° at ${destination.height}m height${easingFunction ? ` with ${easingFunction} easing` : ""}`,
            finalPosition: destination,
            finalOrientation,
            stats: {
              responseTime,
              actualDuration: result.actualDuration ?? null,
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
          message: `Failed to execute camera fly: ${formatErrorMessage(error)}`,
          finalPosition: destination,
          finalOrientation: orientation || DEFAULT_ORIENTATION,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
