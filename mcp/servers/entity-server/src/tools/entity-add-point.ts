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
    generateEntityId
} from "../utils/utils.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer
} from "@cesium-mcp/shared";

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
      try {
        const entityId = id || generateEntityId("point");
        const entityName = name || "Point";

        // Build entity with defaults
        const entity = {
          id: entityId,
          name: entityName,
          description,
          position,
          point: point || {
            pixelSize: DEFAULT_POINT_SIZE,
            color: DEFAULT_POINT_COLOR,
            outlineColor: DEFAULT_POINT_OUTLINE_COLOR,
            outlineWidth: DEFAULT_POINT_OUTLINE_WIDTH,
          },
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Point entity "${entityName}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId,
            entityName,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Point,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add point entity: ${formatErrorMessage(error)}`,
          entityId: id,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
