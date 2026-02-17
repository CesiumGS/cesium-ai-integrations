import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import {
  CameraControllerOptionsSchema,
  CameraControllerOptionsResponseSchema,
} from "../schemas/index.js";
import { ResponseEmoji } from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "../utils/utils.js";

export function registerCameraSetControllerOptions(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "camera_set_controller_options",
    {
      title: "Set Camera Controller Options",
      description: "Configure camera movement constraints and behavior",
      inputSchema: CameraControllerOptionsSchema.shape,
      outputSchema: CameraControllerOptionsResponseSchema.shape,
    },
    async ({
      enableCollisionDetection,
      minimumZoomDistance,
      maximumZoomDistance,
      enableTilt,
      enableRotate,
      enableTranslate,
      enableZoom,
      enableLook,
    }) => {
      try {
        const command = {
          type: "camera_set_controller_options",
          options: {
            enableCollisionDetection,
            minimumZoomDistance,
            maximumZoomDistance,
            enableTilt,
            enableRotate,
            enableTranslate,
            enableZoom,
            enableLook,
          },
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
        );

        if (result.success) {
          const output = {
            success: true,
            message: "Camera controller options updated",
            settings: {
              enableCollisionDetection: enableCollisionDetection ?? null,
              minimumZoomDistance: minimumZoomDistance ?? null,
              maximumZoomDistance: maximumZoomDistance ?? null,
              enableTilt: enableTilt ?? null,
              enableRotate: enableRotate ?? null,
              enableTranslate: enableTranslate ?? null,
              enableZoom: enableZoom ?? null,
              enableLook: enableLook ?? null,
            },
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

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to set controller options: ${formatErrorMessage(error)}`,
          settings: {
            enableCollisionDetection: enableCollisionDetection ?? true,
            minimumZoomDistance: minimumZoomDistance ?? null,
            maximumZoomDistance: maximumZoomDistance ?? null,
            enableTilt: enableTilt ?? true,
            enableRotate: enableRotate ?? true,
            enableTranslate: enableTranslate ?? true,
            enableZoom: enableZoom ?? true,
            enableLook: enableLook ?? true,
          },
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(errorOutput.stats.responseTime, errorOutput);
      }
    },
  );
}
