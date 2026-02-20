import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ICommunicationServer,
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import {
  PathUpdateConfigSchema,
  GenericAnimationResponseSchema,
} from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_update_path tool
 */
export function registerAnimationUpdatePath(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    'animation_update_path',
    {
      title: 'Update Animation Path Visualization',
      description: 'Update the visual appearance of an existing animation path trail (lead/trail time, width, color)',
      inputSchema: PathUpdateConfigSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async (args) => {
      try {
        const validatedArgs = PathUpdateConfigSchema.parse(args);
        
        // Pass command directly to client - it will validate if animation exists
        const command = {
          type: 'animation_update_path',
          animationId: validatedArgs.animationId,
          leadTime: validatedArgs.leadTime,
          trailTime: validatedArgs.trailTime,
          width: validatedArgs.width,
          color: validatedArgs.color
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            animationId: validatedArgs.animationId,
            message: 'Path visualization updated',
            stats: { responseTime }
          };

          return buildSuccessResponse(
            ResponseEmoji.Settings,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || 'Unknown error from client');
      } catch (error) {
        return buildErrorResponse(
          0,
          {
            success: false,
            message: `Failed to update path: ${formatErrorMessage(error)}`,
            stats: { responseTime: 0 },
          },
        );
      }
    }
  );
}
