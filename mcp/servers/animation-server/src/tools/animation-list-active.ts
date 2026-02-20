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
import { animations } from "../utils/shared-state.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

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
          const clientAnimations: AnimationState[] = (result.animations as AnimationState[]) || [];
          const clientClockState: Clock = (result.clockState as Clock) || {
            startTime: { dayNumber: 0, secondsOfDay: 0 },
            stopTime: { dayNumber: 0, secondsOfDay: 0 },
            currentTime: { dayNumber: 0, secondsOfDay: 0 },
            clockRange: "UNBOUNDED" as const,
            multiplier: 1,
            shouldAnimate: false,
          };

          // Simple list with essential info only
          const animationsList = clientAnimations.map((clientAnim) => {
            const serverAnim = Array.from(animations.values()).find(
              (a) => a.entityId === clientAnim.entityId,
            );

            return {
              entityId: clientAnim.entityId,
              name: clientAnim.name || undefined,
              isAnimating: serverAnim ? serverAnim.isPlaying : clientClockState.shouldAnimate || false,
              startTime: clientAnim.startTime,
              stopTime: clientAnim.stopTime,
              clockMultiplier: serverAnim?.currentSpeed || clientClockState.multiplier || 1.0,
            };
          });

          const output = {
            success: true,
            message: (result.message as string) || `Found ${animationsList.length} active animation(s)`,
            animations: animationsList,
            stats: {
              totalAnimations: animationsList.length,
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Info,
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
            message: `Failed to list animations: ${formatErrorMessage(error)}`,
            stats: { responseTime: 0 },
          },
        );
      }
    },
  );
}
