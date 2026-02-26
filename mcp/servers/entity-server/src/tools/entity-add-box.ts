import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddBoxEntityInputSchema,
  EntityResponseSchema,
  type AddBoxEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  buildBaseEntity,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add box entity tool
 */
export function registerAddBoxEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_box",
    {
      title: "Add Box Entity",
      description:
        "Create a box entity at a specific location with customizable dimensions. " +
        "Boxes are useful for representing buildings, containers, or volumetric data.",
      inputSchema: AddBoxEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      box,
      orientation,
      name,
      description,
      id,
    }: AddBoxEntityInput) => {
      const entityId = id || generateEntityId("box");
      const entityName = name || "Box";

      const entity = buildBaseEntity(
        { id: entityId, name: entityName, description, position, orientation },
        box,
        "box",
      );

      return handleEntityAdd(
        communicationServer,
        entity,
        "box",
        ResponseEmoji.Box,
        () =>
          `Box entity "${entityName}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
