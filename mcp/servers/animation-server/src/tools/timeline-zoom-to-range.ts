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
  TimelineZoomToRangeInputSchema,
  ClockResponseSchema,
} from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register timeline_zoom_to_range tool
 */
export function registerTimelineZoomToRange(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "timeline_zoom_to_range",
    {
      title: "Zoom Timeline to Range",
      description: "Zoom the timeline to display a specific time range",
      inputSchema: TimelineZoomToRangeInputSchema.shape,
      outputSchema: ClockResponseSchema.shape,
    },
    async ({ startTime, stopTime }) => {
      try {
        const command = {
          type: "timeline_zoom",
          startTime,
          stopTime,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Timeline zoomed to range ${startTime.dayNumber}:${startTime.secondsOfDay} - ${stopTime.dayNumber}:${stopTime.secondsOfDay}`,
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
            message: `Failed to zoom timeline: ${formatErrorMessage(error)}`,
            stats: {
              responseTime: 0,
            },
          },
        );
      }
    },
  );
}
