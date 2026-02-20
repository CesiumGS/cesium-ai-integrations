import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ICommunicationServer,
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji
} from "@cesium-mcp/shared";
import {
  AnimationPauseInputSchema,
  GenericAnimationResponseSchema,
} from "../schemas/index.js";
import { animations } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_pause tool
 */
export function registerAnimationPause(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_pause",
    {
      title: "Pause Animation",
      description: "Pause animation playback",
      inputSchema: AnimationPauseInputSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async ({ animationId }) => {
      try {
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        animState.isPlaying = false;

        const command = {
          type: "animation_pause",
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
            message: `Animation paused for ${animationId}`,
            animationId,
            entityId: animState.entityId,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            ResponseEmoji.Pause,
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
            message: `Failed to pause animation: ${formatErrorMessage(error)}`,
            animationId,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
