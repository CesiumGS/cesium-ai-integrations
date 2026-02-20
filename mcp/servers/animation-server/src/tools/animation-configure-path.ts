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
import { animations } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_configure_path tool
 */
export function registerAnimationConfigurePath(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    'animation_configure_path',
    {
      title: 'Configure Path Visualization',
      description: 'Update the visual appearance of an animation path trail',
      inputSchema: PathUpdateConfigSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async (args) => {
      try {
        const validatedArgs = PathUpdateConfigSchema.parse(args);
        const animState = animations.get(validatedArgs.animationId);
        
        if (!animState) {
          throw new Error(`Animation ${validatedArgs.animationId} not found`);
        }
        
        const command = {
          type: 'animation_configure_path',
          animationId: validatedArgs.animationId,
          entityId: animState.entityId,
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
            entityId: animState.entityId,
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
            message: `Failed to configure path: ${formatErrorMessage(error)}`,
            stats: { responseTime: 0 },
          },
        );
      }
    }
  );
}
