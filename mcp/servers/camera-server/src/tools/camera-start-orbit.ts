import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import {
  OrbitOptionsSchema,
  CameraOrbitResponseSchema,
} from "../schemas/index.js";
import { DEFAULT_ORBIT_SPEED, ResponseEmoji } from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "../utils/utils.js";

export function registerCameraStartOrbit(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_start_orbit",
    {
      title: "Start Camera Orbit",
      description: "Start orbiting around the current look-at target",
      inputSchema: OrbitOptionsSchema.shape,
      outputSchema: CameraOrbitResponseSchema.shape,
    },
    async ({ speed = DEFAULT_ORBIT_SPEED, direction = "counterclockwise" }) => {
      try {
        const command = {
          type: "camera_start_orbit",
          speed: direction === "clockwise" ? -Math.abs(speed) : Math.abs(speed),
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Camera orbit started (${direction}, ${Math.abs(speed)} rad/s)`,
            orbitActive: true,
            speed,
            direction,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Orbit,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to start orbit: ${formatErrorMessage(error)}`,
          orbitActive: false,
          speed: DEFAULT_ORBIT_SPEED,
          direction: "counterclockwise" as const,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
