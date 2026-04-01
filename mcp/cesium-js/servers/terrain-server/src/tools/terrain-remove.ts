import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TerrainRemoveInputSchema,
  TerrainRemoveResponseSchema,
} from "../schemas/index.js";
import {
  formatTerrainError,
  type TerrainRemoveResult,
} from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

export function registerTerrainRemove(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "terrain_remove",
    {
      title: "Remove Terrain Provider",
      description:
        "Remove the current terrain provider and reset to the default WGS84 ellipsoid " +
        "(flat globe with no terrain elevation data).",
      inputSchema: TerrainRemoveInputSchema.shape,
      outputSchema: TerrainRemoveResponseSchema.shape,
    },
    async () => {
      try {
        const command = {
          type: "terrain_remove" as const,
        };

        const { result, responseTime } =
          await executeWithTiming<TerrainRemoveResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const output = {
            success: true,
            message: result.previousName
              ? `Terrain provider '${result.previousName}' removed, reset to ellipsoid`
              : "Terrain provider removed, reset to ellipsoid",
            previousSourceType: result.previousSourceType,
            previousName: result.previousName,
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
          operation: "remove",
        });

        const errorOutput = {
          success: false,
          message: formatted,
          previousSourceType: undefined,
          previousName: undefined,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
