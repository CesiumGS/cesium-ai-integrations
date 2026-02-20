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
  ClockControlInputSchema,
  ClockResponseSchema,
  Clock,
  JulianDate,
} from "../schemas/index.js";
import { DEFAULT_TIMEOUT_MS } from "../utils/constants.js";

/**
 * Register clock_control tool (merged configure/set-time/set-multiplier)
 */
export function registerClockControl(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "clock_control",
    {
      title: "Control Animation Clock",
      description:
        "Configure the global animation clock. Can set full configuration, just the current time, or just the multiplier",
      inputSchema: ClockControlInputSchema.shape,
      outputSchema: ClockResponseSchema.shape,
    },
    async ({ action, clock, currentTime, multiplier }: {
      action: "configure" | "setTime" | "setMultiplier";
      clock?: Clock;
      currentTime?: JulianDate;
      multiplier?: number;
    }) => {
      try {
        let command: any;
        let message: string;

        switch (action) {
          case "configure":
            if (!clock) {
              throw new Error("'clock' parameter is required for 'configure' action");
            }
            command = {
              type: "clock_configure",
              clock,
            };
            message = `Clock configured from ${clock.startTime.dayNumber}:${clock.startTime.secondsOfDay} to ${clock.stopTime.dayNumber}:${clock.stopTime.secondsOfDay}`;
            break;

          case "setTime":
            if (!currentTime) {
              throw new Error("'currentTime' parameter is required for 'setTime' action");
            }
            command = {
              type: "clock_set_time",
              currentTime,
            };
            message = `Clock time set to ${currentTime.dayNumber}:${currentTime.secondsOfDay}`;
            break;

          case "setMultiplier":
            if (multiplier === undefined) {
              throw new Error("'multiplier' parameter is required for 'setMultiplier' action");
            }
            command = {
              type: "clock_multiplier",
              multiplier,
            };
            message = `Clock multiplier set to ${multiplier}x real time`;
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message,
            clockState: action === "configure" ? clock : undefined,
            stats: {
              responseTime,
            },
          };

          return buildSuccessResponse(
            action === "setMultiplier" ? ResponseEmoji.Speed : ResponseEmoji.Settings,
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
            message: `Failed to control clock: ${formatErrorMessage(error)}`,
            stats: {
              responseTime: 0,
            },
          },
        );
      }
    },
  );
}
