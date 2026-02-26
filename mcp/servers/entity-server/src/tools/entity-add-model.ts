import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddModelEntityInputSchema,
  EntityResponseSchema,
  type AddModelEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import type { Entity } from "../utils/types.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add model entity tool
 */
export function registerAddModelEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_model",
    {
      title: "Add 3D Model Entity",
      description:
        "Create a 3D model entity (glTF/GLB) at a specific location with orientation. " +
        "Models are useful for buildings, vehicles, and complex 3D objects. " +
        "IMPORTANT: Always ask the user for a model URL before calling this tool, unless they already provided one. " +
        "Do NOT invent or guess model URLs.",
      inputSchema: AddModelEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      model,
      orientation,
      name,
      description,
      id,
    }: AddModelEntityInput) => {
      const entityId = id || generateEntityId("model");
      const entityName = name || "3D Model";

      const entity: Entity = {
        id: entityId,
        name: entityName,
        position,
        model,
      };

      if (description) {
        entity.description = description;
      }

      if (orientation) {
        entity.orientation = orientation;
      }

      return handleEntityAdd(
        communicationServer,
        entity,
        "3D model",
        ResponseEmoji.Model,
        () =>
          `3D Model entity "${entityName}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
