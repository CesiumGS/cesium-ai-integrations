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
  AnimationUpdateSpeedInputSchema,
  GenericAnimationResponseSchema,
} from "../schemas/index.js";
import { animations } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_update_speed tool
 */
export function registerAnimationUpdateSpeed(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_update_speed",
    {
      title: "Update Animation Speed",
      description:
        "Change the playback speed multiplier of the animation clock",
      inputSchema: AnimationUpdateSpeedInputSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async ({ animationId, multiplier }) => {
      try {
        // If animationId provided, validate it exists
        if (animationId) {
          const animState = animations.get(animationId);
          if (!animState) {
            throw new Error(`Animation ${animationId} not found`);
          }
          animState.currentSpeed = multiplier;
        } else {
          // Update all animations
          animations.forEach((anim) => {
            anim.currentSpeed = multiplier;
          });
        }

        const command = {
          type: "animation_update_speed",
          animationId,
          multiplier,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: animationId
              ? `Speed updated to ${multiplier}x for ${animationId}`
              : `Global speed updated to ${multiplier}x`,
            animationId,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            ResponseEmoji.Speed,
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
            message: `Failed to update speed: ${formatErrorMessage(error)}`,
            animationId,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
