import { z } from "zod";

/**
 * Core 3D Tiles data type schemas
 * These represent fundamental tileset types used across tileset tools
 */

/**
 * Supported tileset source types
 *
 * - ion: Load a generic Cesium Ion 3D Tiles asset by assetId
 * - url: Load a tileset from a direct URL (tileset.json)
 */
export const TilesetSourceTypeSchema = z
  .enum(["ion", "url"])
  .describe(
    "Source type for loading the 3D tileset. " +
      "'ion': Cesium Ion asset (assetId required). " +
      "'url': direct tileset.json URL (url required).",
  );

/**
 * Summary of a loaded tileset for list operations
 */
export const TilesetSummarySchema = z.object({
  tilesetId: z.string().describe("Unique identifier assigned to this tileset"),
  name: z.string().optional().describe("Display name of the tileset"),
  sourceType: TilesetSourceTypeSchema,
  show: z.boolean().describe("Whether the tileset is currently visible"),
  assetId: z
    .number()
    .optional()
    .describe("Cesium Ion asset ID (ion source type)"),
  url: z.string().optional().describe("Tileset URL (url source type)"),
});

// Type exports for TypeScript
export type TilesetSourceType = z.infer<typeof TilesetSourceTypeSchema>;
export type TilesetSummary = z.infer<typeof TilesetSummarySchema>;
