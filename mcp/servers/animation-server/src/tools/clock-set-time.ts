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
  JulianDateSchema,
  ClockResponseSchema,
} from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register clock_set_time tool
 */
export function registerClockSetTime(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "clock_set_time",
    {
      title: "Set Clock Time",
      description: "Set the current time of the animation clock",
      inputSchema: {
        currentTime: JulianDateSchema,
      },
      outputSchema: ClockResponseSchema.shape,
    },
    async ({ currentTime }) => {
      try {
        const command = {
          type: "clock_set_time",
          currentTime,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Clock time set to ${currentTime.dayNumber}:${currentTime.secondsOfDay}`,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Settings,
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
            message: `Failed to set clock time: ${formatErrorMessage(error)}`,
            stats: {
              responseTime: 0,
            },
          },
        );
      }
    },
  );
}
