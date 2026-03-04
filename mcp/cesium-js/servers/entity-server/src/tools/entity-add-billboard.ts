import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddBillboardEntityInputSchema,
  EntityResponseSchema,
  type AddBillboardEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  buildBaseEntity,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add billboard entity tool
 */
export function registerAddBillboardEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_billboard",
    {
      title: "Add Billboard Entity",
      description:
        "Create a billboard (image marker) entity at a specific location. " +
        "Billboards are always screen-oriented and useful for icons and image markers. " +
        "IMPORTANT: Always ask the user for an image URL before calling this tool, unless they already provided one. " +
        "Do NOT invent or guess image URLs.",
      inputSchema: AddBillboardEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      billboard,
      name,
      description,
      id,
    }: AddBillboardEntityInput) => {
      const entityId = id || generateEntityId("billboard");
      const entityName = name || "Billboard";

      const entity = buildBaseEntity(
        { id: entityId, name: entityName, description, position },
        billboard,
        "billboard",
      );

      return handleEntityAdd(
        communicationServer,
        entity,
        "billboard",
        ResponseEmoji.Billboard,
        () =>
          `Billboard entity "${entityName}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
