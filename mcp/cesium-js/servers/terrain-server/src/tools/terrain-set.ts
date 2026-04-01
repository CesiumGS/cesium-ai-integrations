import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TerrainSetInputSchema,
  TerrainSetResponseSchema,
  type TerrainSetInput,
} from "../schemas/index.js";
import {
  validateSourceTypeParams,
  formatTerrainError,
  type TerrainSetResult,
} from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

export function registerTerrainSet(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "terrain_set",
    {
      title: "Set Terrain Provider",
      description:
        "Set the terrain provider for the Cesium scene. Supports Cesium Ion terrain " +
        "assets (type='ion'), direct terrain server URLs (type='url'), and WGS84 " +
        "ellipsoid (type='ellipsoid') for a flat globe with no terrain. " +
        "The default Cesium World Terrain can be loaded with type='ion' and assetId=1.",
      inputSchema: TerrainSetInputSchema.shape,
      outputSchema: TerrainSetResponseSchema.shape,
    },
    async ({
      type,
      assetId,
      url,
      name,
      requestVertexNormals,
      requestWaterMask,
      requestMetadata,
    }: TerrainSetInput) => {
      try {
        validateSourceTypeParams(type, { assetId, url });

        const command = {
          type: "terrain_set" as const,
          sourceType: type,
          assetId,
          url,
          name,
          requestVertexNormals,
          requestWaterMask,
          requestMetadata,
        };

        const { result, responseTime } =
          await executeWithTiming<TerrainSetResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const terrainName = name || result.name || type;

          const output = {
            success: true,
            message: `Terrain provider '${terrainName}' set successfully`,
            sourceType: type,
            name: terrainName,
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
        const terrainName = name || type;
        const formatted = formatTerrainError(error, {
          operation: "set",
          identifier: terrainName,
        });

        const errorOutput = {
          success: false,
          message: formatted,
          sourceType: type,
          name: terrainName,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
