import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CameraSetViewInputSchema,
  CameraSetViewResponseSchema,
} from "../schemas/index.js";
import { DEFAULT_ORIENTATION } from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer
} from "@cesium-mcp/shared";

export function registerCameraSetView(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_set_view",
    {
      title: "Set Camera View",
      description:
        "Instantly set camera position and orientation without animation",
      inputSchema: CameraSetViewInputSchema.shape,
      outputSchema: CameraSetViewResponseSchema.shape,
    },
    async ({ destination, orientation }) => {
      try {
        const finalOrientation = orientation || DEFAULT_ORIENTATION;

        const command = {
          type: "camera_set_view",
          destination,
          orientation: finalOrientation,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Camera view set to ${destination.latitude}°, ${destination.longitude}° at ${destination.height}m height`,
            position: destination,
            orientation: finalOrientation,
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
          message: `Failed to set camera view: ${formatErrorMessage(error)}`,
          position: destination,
          orientation: orientation || DEFAULT_ORIENTATION,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
