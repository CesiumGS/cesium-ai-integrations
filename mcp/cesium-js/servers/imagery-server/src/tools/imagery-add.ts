import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ImageryAddInputSchema,
  ImageryAddResponseSchema,
  type ImageryAddInput,
} from "../schemas/index.js";
import type { ImageryAddResult } from "../utils/types.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the imagery_add tool
 */
export function registerImageryAdd(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "imagery_add",
    {
      title: "Add Imagery Layer",
      description:
        "Add a new imagery layer to the globe. Supports various provider types " +
        "including URL templates, WMS, WMTS, ArcGIS, Bing Maps, TMS, OpenStreetMap, " +
        "Cesium Ion, and single tile providers.",
      inputSchema: ImageryAddInputSchema.shape,
      outputSchema: ImageryAddResponseSchema.shape,
    },
    async ({
      type,
      url,
      name,
      layers,
      style,
      format,
      tileMatrixSetID,
      maximumLevel,
      minimumLevel,
      alpha,
      show,
      rectangle,
    }: ImageryAddInput) => {
      try {
        const command = {
          type: "imagery_add" as const,
          providerType: type,
          url,
          name,
          layers,
          style,
          format,
          tileMatrixSetID,
          maximumLevel,
          minimumLevel,
          alpha,
          show,
          rectangle,
        };

        const { result, responseTime } =
          await executeWithTiming<ImageryAddResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const layerName = name || result.layerName || type;

          const output = {
            success: true,
            message: `Imagery layer '${layerName}' added successfully at index ${result.layerIndex ?? "unknown"}`,
            layerIndex: result.layerIndex,
            layerName,
            providerType: type,
            stats: {
              responseTime,
              totalLayers: result.totalLayers,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Success,
            responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to add imagery layer: ${formatErrorMessage(error)}`,
          layerIndex: undefined,
          layerName: name,
          providerType: type,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
