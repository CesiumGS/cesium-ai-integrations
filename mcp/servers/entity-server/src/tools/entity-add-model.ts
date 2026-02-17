import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddModelEntityInputSchema,
  EntityResponseSchema,
  type AddModelEntityInput,
} from "../schemas/index.js";
import { generateEntityId } from "../utils/utils.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the add model entity tool
 */
export function registerAddModelEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_model",
    {
      title: "Add 3D Model Entity",
      description:
        "Create a 3D model entity (glTF) at a specific location with orientation. " +
        "Models are useful for buildings, vehicles, and complex 3D objects.",
      inputSchema: AddModelEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      model,
      orientation,
      name,
      description,
      id,
    }: AddModelEntityInput) => {
      try {
        const entityId = id || generateEntityId("model");
        const entityName = name || "3D Model";

        const entity = {
          id: entityId,
          name: entityName,
          description,
          position,
          orientation,
          model,
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
            message: `3D Model entity "${entityName}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId,
            entityName,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Model,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add 3D model entity: ${formatErrorMessage(error)}`,
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
