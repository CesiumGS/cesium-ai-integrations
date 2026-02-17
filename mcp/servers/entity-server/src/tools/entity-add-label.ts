import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddLabelEntityInputSchema,
  EntityResponseSchema,
  type AddLabelEntityInput,
} from "../schemas/index.js";
import { generateEntityId } from "../utils/utils.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer
} from "@cesium-mcp/shared";

/**
 * Register the add label entity tool
 */
export function registerAddLabelEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_label",
    {
      title: "Add Label Entity",
      description:
        "Create a text label entity at a specific location. " +
        "Labels are useful for annotations, names, and information display.",
      inputSchema: AddLabelEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, label, name, description, id }: AddLabelEntityInput) => {
      try {
        const entityId = id || generateEntityId("label");
        const entityName = name || "Label";

        const entity = {
          id: entityId,
          name: entityName,
          description,
          position,
          label,
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Label entity "${entityName}" with text "${label.text}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId,
            entityName,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Label,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add label entity: ${formatErrorMessage(error)}`,
          entityId: id,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
