import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddCorridorEntityInputSchema,
  EntityResponseSchema,
  type AddCorridorEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  handleEntityAdd,
  calculateCenterPosition,
} from "../utils/utils.js";
import type { Entity } from "../utils/types.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add corridor entity tool
 */
export function registerAddCorridorEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_corridor",
    {
      title: "Add Corridor Entity",
      description:
        "Create a corridor entity along a path with specified width. " +
        "Corridors are useful for representing roads, pipelines, routes, or paths.",
      inputSchema: AddCorridorEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ corridor, name, description, id }: AddCorridorEntityInput) => {
      const entityId = id || generateEntityId("corridor");
      const entityName = name || "Corridor";

      const entity: Entity = {
        id: entityId,
        name: entityName,
        corridor,
      };

      if (description) {
        entity.description = description;
      }

      const centerPos = calculateCenterPosition(corridor.positions);

      return handleEntityAdd(
        communicationServer,
        entity,
        "corridor",
        ResponseEmoji.Corridor,
        () =>
          `Corridor entity "${entityName}" with ${corridor.positions.length} positions added (center: ${centerPos.latitude.toFixed(4)}°, ${centerPos.longitude.toFixed(4)}°)`,
        id,
      );
    },
  );
}
