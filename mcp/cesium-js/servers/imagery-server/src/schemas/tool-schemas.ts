import { z } from "zod";
import {
  ImageryProviderTypeSchema,
  ImageryRectangleSchema,
} from "./core-schemas.js";

/**
 * Tool-specific input schemas for imagery operations
 */

/**
 * Input schema for imagery_add tool
 * Adds a new imagery layer to the globe
 */
export const ImageryAddInputSchema = z.object({
  type: ImageryProviderTypeSchema,
  url: z
    .string()
    .optional()
    .describe(
      "URL of the imagery service or tile template (not required for IonImageryProvider)",
    ),
  name: z.string().optional().describe("Display name for the imagery layer"),
  layers: z
    .string()
    .optional()
    .describe("Comma-separated layer names (for WMS/WMTS providers)"),
  style: z.string().optional().describe("Style name (for WMS/WMTS providers)"),
  format: z
    .string()
    .optional()
    .describe("Image format, e.g. 'image/png' (for WMS/WMTS providers)"),
  tileMatrixSetID: z
    .string()
    .optional()
    .describe("Tile matrix set identifier (for WMTS providers)"),
  maximumLevel: z
    .number()
    .min(0)
    .max(30)
    .optional()
    .describe("Maximum zoom level for the imagery layer"),
  minimumLevel: z
    .number()
    .min(0)
    .max(30)
    .optional()
    .describe("Minimum zoom level for the imagery layer"),
  alpha: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Layer opacity (0 = transparent, 1 = opaque, default: 1)"),
  show: z
    .boolean()
    .optional()
    .describe("Whether the layer is visible (default: true)"),
  rectangle: ImageryRectangleSchema.optional().describe(
    "Geographic extent to restrict the imagery layer",
  ),
  assetId: z
    .number()
    .optional()
    .describe("Cesium Ion asset ID (required for IonImageryProvider)"),
  key: z
    .string()
    .optional()
    .describe("API key (required for BingMapsImageryProvider)"),
});

/**
 * Input schema for imagery_remove tool
 * Removes an imagery layer from the globe
 */
export const ImageryRemoveInputSchema = z.object({
  index: z
    .number()
    .min(0)
    .optional()
    .describe("Index of the imagery layer to remove"),
  name: z.string().optional().describe("Name of the imagery layer to remove"),
  removeAll: z
    .boolean()
    .optional()
    .describe("Remove all non-base imagery layers"),
});

/**
 * Input schema for imagery_list tool
 * Lists all imagery layers on the globe
 */
export const ImageryListInputSchema = z.object({
  includeDetails: z
    .boolean()
    .optional()
    .describe("Include detailed provider information"),
});

// Type exports for TypeScript
export type ImageryAddInput = z.infer<typeof ImageryAddInputSchema>;
export type ImageryRemoveInput = z.infer<typeof ImageryRemoveInputSchema>;
export type ImageryListInput = z.infer<typeof ImageryListInputSchema>;
