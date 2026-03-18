import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ImageryListInputSchema,
  ImageryListResponseSchema,
  type ImageryListInput,
  type ImageryLayerSummary,
} from "../schemas/index.js";
import type { ImageryListResult } from "../utils/types.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildErrorResponse,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Register the imagery_list tool
 */
export function registerImageryList(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "imagery_list",
    {
      title: "List Imagery Layers",
      description:
        "Get a list of all imagery layers currently on the globe with their " +
        "indices, names, visibility, and provider types.",
      inputSchema: ImageryListInputSchema.shape,
      outputSchema: ImageryListResponseSchema.shape,
    },
    async ({ includeDetails = false }: ImageryListInput) => {
      try {
        const command = {
          type: "imagery_list" as const,
          includeDetails,
        };

        const { result, responseTime } =
          await executeWithTiming<ImageryListResult>(
            communicationServer,
            command,
          );

        if (result.success) {
          const layers: ImageryLayerSummary[] = Array.isArray(result.layers)
            ? result.layers
            : [];

          const output = {
            success: true,
            message: `Found ${layers.length} imagery layer${layers.length === 1 ? "" : "s"} on the globe`,
            layers,
            totalCount: layers.length,
            stats: {
              totalLayers: layers.length,
              responseTime,
            },
          };

          // Create summary text
          let summaryText = `${output.message} (${responseTime}ms)`;
          if (layers.length > 0) {
            summaryText += "\n\nImagery Layers:\n";

            layers.forEach((layer, idx) => {
              const visibility = layer.show ? "visible" : "hidden";
              summaryText += `${idx + 1}. ${layer.name || `Layer ${layer.index}`} [${visibility}, alpha=${layer.alpha}]`;
              if (layer.providerType && includeDetails) {
                summaryText += ` (${layer.providerType})`;
              }
              summaryText += "\n";
            });
          }

          return {
            content: [
              {
                type: "text" as const,
                text: summaryText,
              },
            ],
            structuredContent: output,
          };
        }

        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const errorOutput = {
          success: false,
          message: `Failed to list imagery layers: ${formatErrorMessage(error)}`,
          layers: [],
          totalCount: 0,
          stats: {
            totalLayers: 0,
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
