import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddPolylineEntityInputSchema,
  EntityResponseSchema,
  type AddPolylineEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  handleEntityAdd,
  formatMultiplePositions,
} from "../utils/utils.js";
import type { Entity } from "../utils/types.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

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
      const entityId = id || generateEntityId("polyline");
      const entityName = name || "Polyline";

      const entity: Entity = {
        id: entityId,
        name: entityName,
        polyline,
      };

      if (description) {
        entity.description = description;
      }

      const positionsText = formatMultiplePositions(polyline.positions, 2);

      return handleEntityAdd(
        communicationServer,
        entity,
        "polyline",
        ResponseEmoji.Polyline,
        () =>
          `Polyline entity "${entityName}" with ${polyline.positions.length} points added from ${positionsText}`,
        id,
      );
    },
  );
}
