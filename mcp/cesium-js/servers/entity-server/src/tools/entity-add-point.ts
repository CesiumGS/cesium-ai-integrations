import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddPointEntityInputSchema,
  EntityResponseSchema,
  type AddPointEntityInput,
} from "../schemas/index.js";
import {
  DEFAULT_POINT_SIZE,
  DEFAULT_POINT_COLOR,
  DEFAULT_POINT_OUTLINE_COLOR,
  DEFAULT_POINT_OUTLINE_WIDTH,
} from "../utils/constants.js";
import {
  generateEntityId,
  buildBaseEntity,
  handleEntityAdd,
  formatPositionMessage,
} from "../utils/utils.js";
import { ResponseEmoji, type ICommunicationServer } from "@cesium-mcp/shared";

/**
 * Register the add point entity tool
 */
export function registerAddPointEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_add_point",
    {
      title: "Add Point Entity",
      description:
        "Create a point entity at a specific location with customizable appearance. " +
        "Use this to add markers, landmarks, or points of interest to the 3D scene.",
      inputSchema: AddPointEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, point, name, description, id }: AddPointEntityInput) => {
      const entityId = id || generateEntityId("point");
      const entityName = name || "Point";

      const entity = buildBaseEntity(
        { id: entityId, name: entityName, description, position },
        point || {
          pixelSize: DEFAULT_POINT_SIZE,
          color: DEFAULT_POINT_COLOR,
          outlineColor: DEFAULT_POINT_OUTLINE_COLOR,
          outlineWidth: DEFAULT_POINT_OUTLINE_WIDTH,
        },
        "point",
      );

      return handleEntityAdd(
        communicationServer,
        entity,
        "point",
        ResponseEmoji.Point,
        () =>
          `Point entity "${entityName}" added at ${formatPositionMessage(position)}`,
        id,
      );
    },
  );
}
