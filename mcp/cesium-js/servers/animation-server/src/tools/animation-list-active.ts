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
  AnimationListActiveInputSchema,
  AnimationListActiveResponseSchema,
  AnimationState,
  Clock,
} from "../schemas/index.js";
import { DEFAULT_TIMEOUT_MS } from "../utils/constants.js";

/**
 * Register animation_list_active tool
 */
export function registerAnimationListActive(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_list_active",
    {
      title: "List Active Animations",
      description:
        "Get a list of all active animations with their current states",
      inputSchema: AnimationListActiveInputSchema.shape,
      outputSchema: AnimationListActiveResponseSchema.shape,
    },
    async () => {
      try {
        const command = {
          type: "animation_list_active",
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          // Client is the source of truth - use its data directly
          const clientAnimations: AnimationState[] =
            (result.animations as AnimationState[]) || [];
          const clientClockState: Clock = result.clockState as Clock;
          // Return client data as-is
          const animationsList = clientAnimations.map((clientAnim) => ({
            animationId: clientAnim.animationId,
            isAnimating: clientClockState.shouldAnimate || false,
            startTime: clientAnim.startTime,
            stopTime: clientAnim.stopTime,
            clockMultiplier: clientClockState.multiplier || 1.0,
          }));

          // Create detailed message with animation IDs
          let message = `Found ${animationsList.length} active animation(s)`;
          if (animationsList.length > 0) {
            const animationDetails = animationsList
              .map((anim) => `\n  - ID: ${anim.animationId}`)
              .join("");
            message += `:${animationDetails}`;
          }

          const output = {
            success: true,
            message,
            animations: animationsList,
            stats: {
              totalAnimations: animationsList.length,
              responseTime,
            },
          };

          return buildSuccessResponse(ResponseEmoji.Info, responseTime, output);
        }

        throw new Error(result.error || "Unknown error from client");
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Failed to list animations: ${formatErrorMessage(error)}`,
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
