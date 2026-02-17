import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CameraOrbitResponseSchema } from "../schemas/index.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer
} from "@cesium-mcp/shared";

export function registerCameraStopOrbit(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_stop_orbit",
    {
      title: "Stop Camera Orbit",
      description: "Stop the current camera orbit animation",
      inputSchema: {},
      outputSchema: CameraOrbitResponseSchema.shape,
    },
    async () => {
      try {
        const command = {
          type: "camera_stop_orbit",
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: "Camera orbit stopped",
            orbitActive: false,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(ResponseEmoji.Stop, responseTime, output);
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to stop orbit: ${formatErrorMessage(error)}`,
          orbitActive: false,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
