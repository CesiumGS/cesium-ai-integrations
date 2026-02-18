import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddEllipseEntityInputSchema,
  EntityResponseSchema,
  type AddEllipseEntityInput,
} from "../schemas/index.js";
import {
  generateEntityId,
  buildBaseEntity,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add ellipse entity tool
 */
export function registerAddEllipseEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_ellipse",
    {
      title: "Add Ellipse Entity",
      description:
        "Create an ellipse entity at a specific location with customizable appearance. " +
        "Ellipses are useful for representing circular areas, zones, or coverage regions.",
      inputSchema: AddEllipseEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({
      position,
      ellipse,
      name,
      description,
      id,
    }: AddEllipseEntityInput) => {
      const entityId = id || generateEntityId("ellipse");
      const entityName = name || "Ellipse";

      const entity = buildBaseEntity(
        { id: entityId, name: entityName, description, position },
        ellipse,
        "ellipse",
      );

      return handleEntityAdd(
        communicationServer,
        entity,
        "ellipse",
        ResponseEmoji.Ellipse,
        () =>
          `Ellipse entity "${entityName}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
