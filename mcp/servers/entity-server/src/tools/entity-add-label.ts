import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddLabelEntityInputSchema,
  EntityResponseSchema,
  type AddLabelEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  buildBaseEntity,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add label entity tool
 */
export function registerAddLabelEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_label",
    {
      title: "Add Label Entity",
      description:
        "Create a text label entity at a specific location. " +
        "Labels are useful for annotations, names, and information display.",
      inputSchema: AddLabelEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, label, name, description, id }: AddLabelEntityInput) => {
      const entityId = id || generateEntityId("label");
      const entityName = name || "Label";

      const entity = buildBaseEntity(
        { id: entityId, name: entityName, description, position },
        label,
        "label",
      );

      return handleEntityAdd(
        communicationServer,
        entity,
        "label",
        ResponseEmoji.Label,
        () =>
          `Label entity "${entityName}" with text "${label.text}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
