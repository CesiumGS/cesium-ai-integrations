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
  ClockSchema,
  ClockResponseSchema,
} from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register clock_configure tool
 */
export function registerClockConfigure(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "clock_configure",
    {
      title: "Configure Animation Clock",
      description:
        "Set up the global animation clock with start time, stop time, and animation settings",
      inputSchema: {
        clock: ClockSchema,
      },
      outputSchema: ClockResponseSchema.shape,
    },
    async ({ clock }) => {
      try {
        const command = {
          type: "clock_configure",
          clock,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Clock configured from ${clock.startTime.dayNumber}:${clock.startTime.secondsOfDay} to ${clock.stopTime.dayNumber}:${clock.stopTime.secondsOfDay}`,
            clockState: clock,
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
            message: `Failed to configure clock: ${formatErrorMessage(error)}`,
            stats: {
              responseTime: 0,
            },
          },
        );
      }
    },
  );
}
