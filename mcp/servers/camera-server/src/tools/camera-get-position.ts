import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CameraGetPositionResponseSchema } from "../schemas/index.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer
} from "@cesium-mcp/shared";
import type { CameraPositionResult } from "../utils/index.js";

export function registerCameraGetPosition(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_get_position",
    {
      title: "Get Camera Position",
      description:
        "Get comprehensive camera information including position, orientation, and view bounds",
      inputSchema: {},
      outputSchema: CameraGetPositionResponseSchema.shape,
    },
    async () => {
      try {
        const command = {
          type: "camera_get_position",
        };

        const { result, responseTime } =
          await executeWithTiming<CameraPositionResult>(
            communicationServer,
            command,
          );

        if (result.success && result.position && result.orientation) {
          const output = {
            success: true,
            message: `Camera at ${result.position.latitude.toFixed(4)}°, ${result.position.longitude.toFixed(4)}° (${Math.round(result.position.height)}m altitude)`,
            position: result.position,
            orientation: result.orientation,
            viewRectangle: result.viewRectangle,
            altitude: result.altitude || result.position.height,
            timestamp: new Date().toISOString(),
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Position,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Failed to get camera position");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to get camera position: ${formatErrorMessage(error)}`,
          position: { longitude: 0, latitude: 0, height: 0 },
          orientation: { heading: 0, pitch: 0, roll: 0 },
          viewRectangle: undefined,
          altitude: 0,
          timestamp: new Date().toISOString(),
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
