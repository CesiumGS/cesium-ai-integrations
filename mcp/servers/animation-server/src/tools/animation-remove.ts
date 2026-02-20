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
import { animations, getTrackedEntityId, setTrackedEntityId } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

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
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        const entityId = animState.entityId;
        animations.delete(animationId);

        if (getTrackedEntityId() === entityId) {
          setTrackedEntityId(null);
        }

        const command = {
          type: "animation_remove",
          animationId,
          entityId,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Animation ${animationId} removed (${animations.size} remaining)`,
            animationId,
            entityId,
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
        return buildErrorResponse(
          0,
          {
            success: false,
            message: `Failed to remove animation: ${formatErrorMessage(error)}`,
            animationId,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
