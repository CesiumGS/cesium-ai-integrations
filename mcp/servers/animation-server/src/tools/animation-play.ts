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
  AnimationPlayInputSchema,
  GenericAnimationResponseSchema,
} from "../schemas/index.js";
import { animations } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_play tool
 */
export function registerAnimationPlay(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_play",
    {
      title: "Play Animation",
      description:
        "Start or resume animation playback using the shared Cesium clock",
      inputSchema: AnimationPlayInputSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async ({ animationId }) => {
      try {
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        animState.isPlaying = true;

        const command = {
          type: "animation_play",
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
            message: `Animation playback started for ${animationId}`,
            animationId,
            entityId: animState.entityId,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            ResponseEmoji.Play,
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
            message: `Failed to play animation: ${formatErrorMessage(error)}`,
            animationId,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
