import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TerrainGetInputSchema,
  TerrainGetResponseSchema,
} from "../schemas/index.js";
import { formatTerrainError, type TerrainGetResult } from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

export function registerTerrainGet(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "terrain_get",
    {
      title: "Get Terrain Provider",
      description:
        "Get information about the current terrain provider in the Cesium scene, " +
        "including its source type, name, and configuration.",
      inputSchema: TerrainGetInputSchema.shape,
      outputSchema: TerrainGetResponseSchema.shape,
    },
    async () => {
      try {
        const command = {
          type: "terrain_get" as const,
        };

        const { result, responseTime } =
          await executeWithTiming<TerrainGetResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const output = {
            success: true,
            message: result.terrain
              ? `Current terrain: ${result.terrain.name || result.terrain.sourceType}`
              : "No terrain provider information available",
            terrain: result.terrain,
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
        const formatted = formatTerrainError(error, {
          operation: "get",
        });

        const errorOutput = {
          success: false,
          message: formatted,
          terrain: undefined,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
