import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TilesetListInputSchema,
  TilesetListResponseSchema,
  type TilesetListInput,
  type TilesetSummary,
} from "../schemas/index.js";
import {
  formatTilesetError,
  getTilesetCountMessage,
  type TilesetListResult,
} from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the tileset_list tool
 */
export function registerTilesetList(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "tileset_list",
    {
      title: "List 3D Tilesets",
      description:
        "Get a list of all 3D tilesets currently loaded in the Cesium scene, " +
        "including their IDs, names, source types, and visibility state. " +
        "Use tilesetIds from this list with tileset_remove.",
      inputSchema: TilesetListInputSchema.shape,
      outputSchema: TilesetListResponseSchema.shape,
    },
    async ({ includeDetails = false }: TilesetListInput) => {
      try {
        const command = {
          type: "tileset_list" as const,
          includeDetails,
        };

        const { result, responseTime } =
          await executeWithTiming<TilesetListResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const tilesets: TilesetSummary[] = Array.isArray(result.tilesets)
            ? result.tilesets
            : [];

          const output = {
            success: true,
            message: getTilesetCountMessage(tilesets.length, "Found"),
            tilesets,
            totalCount: result.totalCount ?? tilesets.length,
            stats: {
              totalTilesets: tilesets.length,
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
        const formatted = formatTilesetError(error, {
          operation: "list",
        });

        const errorOutput = {
          success: false,
          message: formatted,
          tilesets: [],
          totalCount: 0,
          stats: {
            totalTilesets: 0,
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
