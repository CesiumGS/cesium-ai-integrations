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
  GenericAnimationResponseSchema,
  AnimationControlInputSchema,
} from "../schemas/index.js";
import { DEFAULT_TIMEOUT_MS } from "../utils/constants.js";

/**
 * Register animation_control tool
 */
export function registerAnimationControl(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_control",
    {
      title: "Control Animation Playback",
      description: "Start, pause, or resume animation playback",
      inputSchema: AnimationControlInputSchema.shape,
      outputSchema: GenericAnimationResponseSchema.shape,
    },
    async ({ animationId, action }) => {
      try {
        // Pass command directly to client - it will validate if animation exists
        const command = {
          type: "animation_control",
          action: action === "play" ? "play" : "pause",
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
            message: `Animation ${action === "play" ? "playback started" : "paused"} for ${animationId}`,
            animationId,
            stats: { responseTime },
          };

          return buildSuccessResponse(
            action === "play" ? ResponseEmoji.Play : ResponseEmoji.Pause,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from client");
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Failed to ${action} animation: ${formatErrorMessage(error)}`,
          animationId,
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
