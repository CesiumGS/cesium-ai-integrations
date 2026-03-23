import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ImageryRemoveInputSchema,
  ImageryRemoveResponseSchema,
  type ImageryRemoveInput,
} from "../schemas/index.js";
import type { ImageryRemoveResult } from "../utils/types.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the imagery_remove tool
 */
export function registerImageryRemove(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "imagery_remove",
    {
      title: "Remove Imagery Layer",
      description:
        "Remove an imagery layer from the globe by index or name. " +
        "Can remove a single layer or all non-base imagery layers.",
      inputSchema: ImageryRemoveInputSchema.shape,
      outputSchema: ImageryRemoveResponseSchema.shape,
    },
    async ({ index, name, removeAll = false }: ImageryRemoveInput) => {
      try {
        if (index === undefined && !name && !removeAll) {
          throw new Error("Either index, name, or removeAll must be provided");
        }

        const command = {
          type: "imagery_remove" as const,
          index,
          name,
          removeAll,
        };

        const { result, responseTime } =
          await executeWithTiming<ImageryRemoveResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const removedCount = removeAll
            ? (result.removedCount ?? 0)
            : (result.removedCount ?? 1);
          const identifier =
            name || (index !== undefined ? `index ${index}` : "all");

          const output = {
            success: true,
            message: removeAll
              ? `Removed ${removedCount} imagery layer${removedCount === 1 ? "" : "s"}`
              : `Imagery layer '${identifier}' removed successfully`,
            removedIndex: result.removedIndex ?? index,
            removedName: result.removedName ?? name,
            removedCount,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Remove,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const identifier =
          name || (index !== undefined ? `index ${index}` : "unknown");
        const errorOutput = {
          success: false,
          message: `Failed to remove imagery layer '${identifier}': ${formatErrorMessage(error)}`,
          removedIndex: index,
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
