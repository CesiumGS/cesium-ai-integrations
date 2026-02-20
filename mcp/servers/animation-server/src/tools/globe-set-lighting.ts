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
  ClockResponseSchema,
  GlobeSetLightingInputSchema,
} from "../schemas/index.js";
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
      inputSchema: GlobeSetLightingInputSchema.shape,
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
