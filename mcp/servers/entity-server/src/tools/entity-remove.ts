import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  RemoveEntityInputSchema,
  RemoveEntityResponseSchema,
  type RemoveEntityInput,
} from "../schemas/index.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ICommunicationServer,
  ResponseEmoji
} from "@cesium-mcp/shared";

/**
 * Register the remove entity tool
 */
export function registerRemoveEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_remove",
    {
      title: "Remove Entity",
      description:
        "Remove an entity from the scene by ID or name pattern. " +
        "Can remove a single entity or all matching entities.",
      inputSchema: RemoveEntityInputSchema.shape,
      outputSchema: RemoveEntityResponseSchema.shape,
    },
    async ({
      entityId,
      namePattern,
      removeAll = false,
      confirmRemoval = true,
    }: RemoveEntityInput) => {
      try {
        // Validation
        if (!entityId && !namePattern) {
          throw new Error("Either entityId or namePattern must be provided");
        }

        const command = {
          type: "entity_remove",
          entityId,
          namePattern,
          removeAll,
          confirmRemoval,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const removedCount = result.removedCount || 1;
          const identifier = entityId || namePattern;

          const output = {
            success: true,
            message: removeAll
              ? `Removed ${removedCount} entit${removedCount === 1 ? "y" : "ies"} matching '${identifier}'`
              : `Entity '${identifier}' removed successfully`,
            removedEntityId: result.removedEntityId || entityId,
            removedEntityName: result.removedEntityName || namePattern,
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
        const identifier = entityId || namePattern || "unknown";
        const errorOutput = {
          success: false,
          message: `Failed to remove entity '${identifier}': ${formatErrorMessage(error)}`,
          removedEntityId: entityId,
          removedEntityName: namePattern,
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
