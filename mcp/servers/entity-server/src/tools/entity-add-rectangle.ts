import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddRectangleEntityInputSchema,
  EntityResponseSchema,
  type AddRectangleEntityInput,
} from "../schemas/index.js";
import { generateEntityId, handleEntityAdd } from "../utils/utils.js";
import type { Entity } from "../utils/types.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add rectangle entity tool
 */
export function registerAddRectangleEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_rectangle",
    {
      title: "Add Rectangle Entity",
      description:
        "Create a rectangle entity defined by geographic bounds. " +
        "Rectangles are useful for representing regions, bounding boxes, or areas of interest.",
      inputSchema: AddRectangleEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ rectangle, name, description, id }: AddRectangleEntityInput) => {
      const entityId = id || generateEntityId("rectangle");
      const entityName = name || "Rectangle";

      const entity: Entity = {
        id: entityId,
        name: entityName,
        rectangle,
      };

      if (description) {
        entity.description = description;
      }

      const coords = rectangle.coordinates;
      const centerLat = (coords.north + coords.south) / 2;
      const centerLon = (coords.east + coords.west) / 2;

      return handleEntityAdd(
        communicationServer,
        entity,
        "rectangle",
        ResponseEmoji.Rectangle,
        () =>
          `Rectangle entity "${entityName}" added (center: ${centerLat.toFixed(4)}°, ${centerLon.toFixed(4)}°)`,
        id,
      );
    },
  );
}
