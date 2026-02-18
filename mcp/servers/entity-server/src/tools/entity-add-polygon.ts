import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddPolygonEntityInputSchema,
  EntityResponseSchema,
  type AddPolygonEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  handleEntityAdd,
  calculateCenterPosition,
} from "../utils/utils.js";
import type { Entity } from "../utils/types.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

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
      const entityId = id || generateEntityId("polygon");
      const entityName = name || "Polygon";

      const entity: Entity = {
        id: entityId,
        name: entityName,
        polygon,
      };

      if (description) {
        entity.description = description;
      }

      const centerPos = calculateCenterPosition(polygon.hierarchy);

      return handleEntityAdd(
        communicationServer,
        entity,
        "polygon",
        ResponseEmoji.Polygon,
        () =>
          `Polygon entity "${entityName}" with ${polygon.hierarchy.length} vertices added (center: ${centerPos.latitude.toFixed(4)}°, ${centerPos.longitude.toFixed(4)}°)`,
        id,
      );
    },
  );
}
