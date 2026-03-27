import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TilesetStyleInputSchema,
  TilesetStyleResponseSchema,
  type TilesetStyleInput,
} from "../schemas/index.js";
import { formatTilesetError, type TilesetStyleResult } from "../utils/index.js";
import {
  executeWithTiming,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the tileset_style tool
 */
export function registerTilesetStyle(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "tileset_style",
    {
      title: "Style 3D Tileset",
      description:
        "Apply or update 3D Tiles styling (color and show conditions) on a loaded tileset. " +
        "Target the tileset by tilesetId (from tileset_add) or by name. " +
        "Use color for a single color expression, colorConditions for conditional coloring, " +
        "show/showConditions for visibility rules. " +
        "IMPORTANT: The 3D Tiles Styling expression language only supports color() with hex or named color strings (e.g. color('#ff0000'), color('red')). " +
        "CSS functions like hsl(), rgb(), or rgba() are NOT supported and will silently fail. " +
        "To create a color ramp based on a feature property (e.g. Height), always use colorConditions with discrete ranges instead of a single color expression. " +
        "Example: colorConditions=[['${Height} >= 100', \"color('#ff0000')\"], ['true', \"color('#00ff00')\"]]",
      inputSchema: TilesetStyleInputSchema.shape,
      outputSchema: TilesetStyleResponseSchema.shape,
    },
    async ({
      tilesetId,
      name,
      color,
      colorConditions,
      show,
      showConditions,
    }: TilesetStyleInput) => {
      try {
        if (!tilesetId && !name) {
          throw new Error("Either tilesetId or name must be provided");
        }

        if (
          color === undefined &&
          colorConditions === undefined &&
          show === undefined &&
          showConditions === undefined
        ) {
          throw new Error(
            "At least one style property (color, colorConditions, show, or showConditions) must be provided",
          );
        }

        const command = {
          type: "tileset_style" as const,
          tilesetId,
          name,
          color,
          colorConditions,
          show,
          showConditions,
        };

        const { result, responseTime } =
          await executeWithTiming<TilesetStyleResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const identifier = tilesetId || name || "unknown";

          const output = {
            success: true,
            message: `3D tileset '${identifier}' styled successfully`,
            tilesetId: result.tilesetId ?? tilesetId,
            name: result.name ?? name,
            appliedStyle: result.appliedStyle,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Success,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const identifier = tilesetId || name || "unknown";
        const formatted = formatTilesetError(error, {
          operation: "style",
          identifier,
        });

        const errorOutput = {
          success: false,
          message: formatted,
          tilesetId,
          name,
          appliedStyle: undefined,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
