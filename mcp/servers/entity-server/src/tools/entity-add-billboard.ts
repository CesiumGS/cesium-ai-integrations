import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddBillboardEntityInputSchema,
  EntityResponseSchema,
  type AddBillboardEntityInput,
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
 * Register the add billboard entity tool
 */
export function registerAddBillboardEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_billboard",
    {
      title: "Add Billboard Entity",
      description:
        "Create a billboard (image marker) entity at a specific location. " +
        "Billboards are always screen-oriented and useful for icons and image markers.",
      inputSchema: AddBillboardEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      billboard,
      name,
      description,
      id,
    }: AddBillboardEntityInput) => {
      try {
        const entityId = id || generateEntityId("billboard");
        const entityName = name || "Billboard";

        const entity = {
          id: entityId,
          name: entityName,
          description,
          position,
          billboard,
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
            message: `Billboard entity "${entityName}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId,
            entityName,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Billboard,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add billboard entity: ${formatErrorMessage(error)}`,
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
