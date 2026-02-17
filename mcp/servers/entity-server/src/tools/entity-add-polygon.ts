import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddPolygonEntityInputSchema,
  EntityResponseSchema,
  type AddPolygonEntityInput,
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
 * Register the add polygon entity tool
 */
export function registerAddPolygonEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_polygon",
    {
      title: "Add Polygon Entity",
      description:
        "Create a polygon entity from an array of positions. " +
        "Polygons are useful for areas, zones, and regions.",
      inputSchema: AddPolygonEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ polygon, name, description, id }: AddPolygonEntityInput) => {
      try {
        const entityId = id || generateEntityId("polygon");
        const entityName = name || "Polygon";

        const entity = {
          id: entityId,
          name: entityName,
          description,
          polygon,
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
          // Calculate center position for reporting
          const centerLat =
            polygon.hierarchy.reduce((sum, pos) => sum + pos.latitude, 0) /
            polygon.hierarchy.length;
          const centerLon =
            polygon.hierarchy.reduce((sum, pos) => sum + pos.longitude, 0) /
            polygon.hierarchy.length;

          const output = {
            success: true,
            message: `Polygon entity "${entityName}" with ${polygon.hierarchy.length} vertices added (center: ${centerLat.toFixed(4)}°, ${centerLon.toFixed(4)}°)`,
            entityId,
            entityName,
            position: {
              latitude: centerLat,
              longitude: centerLon,
              height: polygon.height,
            },
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Polygon,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add polygon entity: ${formatErrorMessage(error)}`,
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
