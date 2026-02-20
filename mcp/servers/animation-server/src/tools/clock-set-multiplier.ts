import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ICommunicationServer,
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import { ClockResponseSchema } from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register clock_set_multiplier tool
 */
export function registerClockSetMultiplier(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "clock_set_multiplier",
    {
      title: "Set Clock Multiplier",
      description:
        "Change the time rate multiplier for speeding up or slowing down time",
      inputSchema: {
        multiplier: z
          .number()
          .describe(
            "Time rate multiplier (e.g., 1000 for 1000x real time)",
          ),
      },
      outputSchema: ClockResponseSchema.shape,
    },
    async ({ multiplier }) => {
      try {
        const command = {
          type: "clock_multiplier",
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
            message: `Clock multiplier set to ${multiplier}x real time`,
            stats: {
              responseTime,
            },
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
            message: `Failed to set clock multiplier: ${formatErrorMessage(error)}`,
            stats: {
              responseTime: 0,
            },
          },
        );
      }
    },
  );
}
