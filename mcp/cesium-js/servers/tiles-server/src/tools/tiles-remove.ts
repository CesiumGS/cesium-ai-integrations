import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TilesetRemoveInputSchema,
  TilesetRemoveResponseSchema,
  type TilesetRemoveInput,
} from "../schemas/index.js";
import {
  formatTilesetError,
  getTilesetCountMessage,
  type TilesetRemoveResult,
} from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the tileset_remove tool
 */
export function registerTilesetRemove(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "tileset_remove",
    {
      title: "Remove 3D Tileset",
      description:
        "Remove a 3D tileset from the Cesium scene. Identify the tileset to " +
        "remove by its tilesetId (returned by tileset_add), by name, or set " +
        "removeAll=true to remove all loaded tilesets at once.",
      inputSchema: TilesetRemoveInputSchema.shape,
      outputSchema: TilesetRemoveResponseSchema.shape,
    },
    async ({ tilesetId, name, removeAll = false }: TilesetRemoveInput) => {
      try {
        if (!tilesetId && !name && !removeAll) {
          throw new Error(
            "Either tilesetId, name, or removeAll must be provided",
          );
        }

        const command = {
          type: "tileset_remove" as const,
          tilesetId,
          name,
          removeAll,
        };

        const { result, responseTime } =
          await executeWithTiming<TilesetRemoveResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const removedCount = removeAll
            ? (result.removedCount ?? 0)
            : (result.removedCount ?? 1);
          const identifier =
            tilesetId || name || (removeAll ? "all tilesets" : "unknown");

          const output = {
            success: true,
            message: removeAll
              ? getTilesetCountMessage(removedCount, "Removed")
              : `3D tileset '${identifier}' removed successfully`,
            removedTilesetId: result.removedTilesetId ?? tilesetId,
            removedName: result.removedName ?? name,
            removedCount,
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
        const identifier = tilesetId || name || "unknown";
        const formatted = formatTilesetError(error, {
          operation: "remove",
          identifier,
        });

        const errorOutput = {
          success: false,
          message: formatted,
          removedTilesetId: tilesetId,
          removedName: name,
          removedCount: 0,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
