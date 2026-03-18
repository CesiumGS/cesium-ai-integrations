import { z } from "zod";

/**
 * Core imagery data type schemas
 * These represent fundamental imagery provider types used across imagery tools
 */

/**
 * Supported imagery provider types in CesiumJS
 */
export const ImageryProviderTypeSchema = z
  .enum([
    "UrlTemplateImageryProvider",
    "WebMapServiceImageryProvider",
    "WebMapTileServiceImageryProvider",
    "ArcGisMapServerImageryProvider",
    "BingMapsImageryProvider",
    "TileMapServiceImageryProvider",
    "OpenStreetMapImageryProvider",
    "IonImageryProvider",
    "SingleTileImageryProvider",
    "GoogleEarthEnterpriseImageryProvider",
  ])
  .describe("Type of imagery provider to create");

/**
 * Geographic rectangle for constraining imagery layer extent
 */
export const ImageryRectangleSchema = z
  .object({
    west: z
      .number()
      .min(-180)
      .max(180)
      .describe("Western longitude in degrees"),
    south: z.number().min(-90).max(90).describe("Southern latitude in degrees"),
    east: z
      .number()
      .min(-180)
      .max(180)
      .describe("Eastern longitude in degrees"),
    north: z.number().min(-90).max(90).describe("Northern latitude in degrees"),
  })
  .describe("Geographic rectangle bounding the imagery layer");

/**
 * Summary of an imagery layer for list operations
 */
export const ImageryLayerSummarySchema = z.object({
  index: z.number().describe("Layer index in the imagery layer collection"),
  name: z.string().optional().describe("Layer name if available"),
  show: z.boolean().describe("Whether the layer is currently visible"),
  alpha: z.number().min(0).max(1).describe("Layer opacity (0-1)"),
  providerType: z.string().optional().describe("Type of imagery provider"),
  url: z.string().optional().describe("Provider URL if available"),
  ready: z.boolean().optional().describe("Whether the provider is ready"),
});

// Type exports for TypeScript
export type ImageryProviderType = z.infer<typeof ImageryProviderTypeSchema>;
export type ImageryRectangle = z.infer<typeof ImageryRectangleSchema>;
export type ImageryLayerSummary = z.infer<typeof ImageryLayerSummarySchema>;
