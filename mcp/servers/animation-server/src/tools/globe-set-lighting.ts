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
 * Register globe_set_lighting tool
 */
export function registerGlobeSetLighting(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "globe_set_lighting",
    {
      title: "Control Globe Lighting",
      description:
        "Enable or disable realistic globe lighting effects for day/night cycles",
      inputSchema: {
        enableLighting: z
          .boolean()
          .describe("Enable realistic lighting effects"),
        enableDynamicAtmosphere: z
          .boolean()
          .optional()
          .default(true)
          .describe("Enable dynamic atmosphere lighting"),
        enableSunLighting: z
          .boolean()
          .optional()
          .default(true)
          .describe("Enable lighting from sun position"),
      },
      outputSchema: ClockResponseSchema.shape,
    },
    async ({ enableLighting, enableDynamicAtmosphere, enableSunLighting }) => {
      try {
        const command = {
          type: "globe_lighting",
          enableLighting,
          enableDynamicAtmosphere,
          enableSunLighting,
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          const output = {
            success: true,
            message: `Globe lighting ${enableLighting ? "enabled" : "disabled"} with dynamic atmosphere: ${enableDynamicAtmosphere}, sun lighting: ${enableSunLighting}`,
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
            message: `Failed to set globe lighting: ${formatErrorMessage(error)}`,
            stats: {
              responseTime: 0,
            },
          },
        );
      }
    },
  );
}
