import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddPolylineEntityInputSchema,
  EntityResponseSchema,
  type AddPolylineEntityInput,
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
 * Register the add polyline entity tool
 */
export function registerAddPolylineEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_polyline",
    {
      title: "Add Polyline Entity",
      description:
        "Create a polyline entity connecting multiple positions. " +
        "Polylines are useful for paths, routes, and connections.",
      inputSchema: AddPolylineEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ polyline, name, description, id }: AddPolylineEntityInput) => {
      try {
        const entityId = id || generateEntityId("polyline");
        const entityName = name || "Polyline";

        const entity = {
          id: entityId,
          name: entityName,
          description,
          polyline,
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
          const startPos = polyline.positions[0];
          const endPos = polyline.positions[polyline.positions.length - 1];

          const output = {
            success: true,
            message: `Polyline entity "${entityName}" with ${polyline.positions.length} points added from ${startPos.latitude.toFixed(4)}°, ${startPos.longitude.toFixed(4)}° to ${endPos.latitude.toFixed(4)}°, ${endPos.longitude.toFixed(4)}°`,
            entityId,
            entityName,
            position: startPos,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Polyline,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add polyline entity: ${formatErrorMessage(error)}`,
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
