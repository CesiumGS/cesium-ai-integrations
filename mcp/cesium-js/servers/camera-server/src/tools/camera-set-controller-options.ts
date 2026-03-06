import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CameraControllerOptionsSchema,
  CameraControllerOptionsResponseSchema,
} from "../schemas/index.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  ICommunicationServer,
} from "@cesium-mcp/shared";
import type { CameraControllerOptionsResult } from "../utils/index.js";

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

        const { result, responseTime } =
          await executeWithTiming<CameraControllerOptionsResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          if (result.settings === null) {
            throw new Error(
              "Cesium viewer did not return controller settings in the response",
            );
          }
          const s = result.settings;

          const output = {
            success: true,
            message: "Camera controller options updated",
            settings: {
              // Prefer viewer-returned value, then caller input, then null.
              // Using ?? so explicit false/0 from the viewer is preserved.
              enableCollisionDetection:
                s?.enableCollisionDetection ?? enableCollisionDetection ?? null,
              minimumZoomDistance:
                s?.minimumZoomDistance ?? minimumZoomDistance ?? null,
              maximumZoomDistance:
                s?.maximumZoomDistance ?? maximumZoomDistance ?? null,
              enableTilt: s?.enableTilt ?? enableTilt ?? null,
              enableRotate: s?.enableRotate ?? enableRotate ?? null,
              enableTranslate: s?.enableTranslate ?? enableTranslate ?? null,
              enableZoom: s?.enableZoom ?? enableZoom ?? null,
              enableLook: s?.enableLook ?? enableLook ?? null,
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
