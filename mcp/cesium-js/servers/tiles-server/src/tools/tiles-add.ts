import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TilesetAddInputSchema,
  TilesetAddResponseSchema,
  type TilesetAddInput,
} from "../schemas/index.js";
import {
  validateSourceTypeParams,
  formatTilesetError,
  type TilesetAddResult,
} from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the tileset_add tool
 */
export function registerTilesetAdd(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "tileset_add",
    {
      title: "Add 3D Tileset",
      description:
        "Add a 3D Tiles tileset to the Cesium scene. Supports loading from " +
        "Cesium Ion assets (type='ion') and direct tileset.json URLs (type='url'). " +
        "Returns a tilesetId that can be used to remove the tileset later.",
      inputSchema: TilesetAddInputSchema.shape,
      outputSchema: TilesetAddResponseSchema.shape,
    },
    async ({ type, assetId, url, name, show }: TilesetAddInput) => {
      try {
        // Validate that required parameters are present for each source type
        validateSourceTypeParams(type, { assetId, url });

        const command = {
          type: "tileset_add" as const,
          sourceType: type,
          assetId,
          url,
          name,
          show,
        };

        const { result, responseTime } =
          await executeWithTiming<TilesetAddResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const tilesetName = name || result.name || type;

          const output = {
            success: true,
            message: `3D tileset '${tilesetName}' added successfully (id: ${result.tilesetId ?? "unknown"})`,
            tilesetId: result.tilesetId,
            name: tilesetName,
            sourceType: type,
            stats: {
              responseTime,
              totalTilesets: result.totalTilesets,
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
        const tilesetName = name || type;
        const formatted = formatTilesetError(error, {
          operation: "add",
          identifier: tilesetName,
        });

        const errorOutput = {
          success: false,
          message: formatted,
          tilesetId: undefined,
          name: tilesetName,
          sourceType: type,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
