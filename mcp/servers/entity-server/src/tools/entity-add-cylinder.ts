import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddCylinderEntityInputSchema,
  EntityResponseSchema,
  type AddCylinderEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  buildBaseEntity,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add cylinder entity tool
 */
export function registerAddCylinderEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_cylinder",
    {
      title: "Add Cylinder Entity",
      description:
        "Create a cylinder or cone entity at a specific location. " +
        "Cylinders are useful for representing towers, pillars, or volumetric structures.",
      inputSchema: AddCylinderEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      cylinder,
      orientation,
      name,
      description,
      id,
    }: AddCylinderEntityInput) => {
      const entityId = id || generateEntityId("cylinder");
      const entityName = name || "Cylinder";

      const entity = buildBaseEntity(
        { id: entityId, name: entityName, description, position, orientation },
        cylinder,
        "cylinder",
      );

      return handleEntityAdd(
        communicationServer,
        entity,
        "cylinder",
        ResponseEmoji.Cylinder,
        () =>
          `Cylinder entity "${entityName}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
