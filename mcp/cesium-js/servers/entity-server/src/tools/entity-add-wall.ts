import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddWallEntityInputSchema,
  EntityResponseSchema,
  type AddWallEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  handleEntityAdd,
  calculateCenterPosition,
} from "../utils/utils.js";
import type { Entity } from "../utils/types.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add wall entity tool
 */
export function registerAddWallEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_wall",
    {
      title: "Add Wall Entity",
      description:
        "Create a wall entity from a series of positions with variable heights. " +
        "Walls are useful for representing barriers, fences, or vertical structures.",
      inputSchema: AddWallEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ wall, name, description, id }: AddWallEntityInput) => {
      const entityId = id || generateEntityId("wall");
      const entityName = name || "Wall";

      const entity: Entity = {
        id: entityId,
        name: entityName,
        wall,
      };

      if (description) {
        entity.description = description;
      }

      const centerPos = calculateCenterPosition(wall.positions);

      return handleEntityAdd(
        communicationServer,
        entity,
        "wall",
        ResponseEmoji.Wall,
        () =>
          `Wall entity "${entityName}" with ${wall.positions.length} positions added (center: ${centerPos.latitude.toFixed(4)}°, ${centerPos.longitude.toFixed(4)}°)`,
        id,
      );
    },
  );
}
