import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListEntitiesInputSchema,
  EntityListResponseSchema,
  type ListEntitiesInput,
  type EntitySummary,
} from "../schemas/index.js";
import type { EntityListResult } from "../utils/types.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildErrorResponse,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the list entities tool
 */
export function registerListEntities(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_list",
    {
      title: "List All Entities",
      description:
        "Get a list of all entities currently in the scene with their IDs, names, and types. " +
        "Optionally filter by entity type or include detailed information.",
      inputSchema: ListEntitiesInputSchema.shape,
      outputSchema: EntityListResponseSchema.shape,
    },
    async ({ includeDetails = false, filterByType }: ListEntitiesInput) => {
      try {
        const command = {
          type: "entity_list" as const,
          includeDetails,
          filterByType,
        };

        const { result, responseTime } =
          await executeWithTiming<EntityListResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const entities: EntitySummary[] = Array.isArray(result.entities)
            ? result.entities
            : [];
          const filteredCount = filterByType
            ? entities.filter((e) => e.type === filterByType).length
            : entities.length;

          const output = {
            success: true,
            message: `Found ${filteredCount} entit${filteredCount === 1 ? "y" : "ies"}${filterByType ? ` of type '${filterByType}'` : ""} in the scene`,
            entities,
            totalCount: entities.length,
            filteredCount,
            stats: {
              totalEntities: entities.length,
              responseTime,
            },
          };

          // Create summary text
          let summaryText = `${output.message} (${responseTime}ms)`;
          if (entities.length > 0) {
            summaryText += "\n\nEntities:\n";

            entities.forEach((entity, index) => {
              summaryText += `${index + 1}. ${entity.name || entity.id} (${entity.type})`;
              if (entity.position && includeDetails) {
                summaryText += ` at ${entity.position.latitude?.toFixed(4)}°, ${entity.position.longitude?.toFixed(4)}°`;
              }
              summaryText += "\n";
            });
          }

          return {
            content: [
              {
                type: "text" as const,
                text: summaryText,
              },
            ],
            structuredContent: output,
          };
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to list entities: ${formatErrorMessage(error)}`,
          entities: [],
          totalCount: 0,
          filteredCount: 0,
          stats: {
            totalEntities: 0,
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
