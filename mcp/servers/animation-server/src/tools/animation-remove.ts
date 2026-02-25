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
  AnimationRemoveInputSchema,
  GenericAnimationResponseSchema,
} from "../schemas/index.js";
import { DEFAULT_TIMEOUT_MS } from "../utils/constants.js";

/**
 * Register animation_remove tool
 */
export function registerAnimationRemove(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_remove",
    {
      title: "Remove Animation",
      description: "Remove an animation and its associated entity",
      inputSchema: AnimationRemoveInputSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async ({ animationId }) => {
      try {
        // Pass command directly to client - it will validate and remove
        const command = {
          type: "animation_remove",
          animationId,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Animation ${animationId} removed`,
            animationId,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            ResponseEmoji.Success,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from client");
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Failed to remove animation: ${formatErrorMessage(error)}`,
          animationId,
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
