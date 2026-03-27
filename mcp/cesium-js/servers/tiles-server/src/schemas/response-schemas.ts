import { z } from "zod";
import { TilesetSummarySchema } from "./core-schemas.js";

/**
 * Response schemas for 3D Tiles operations
 */

/**
 * Common statistics included in responses
 */
export const TilesStatsSchema = z.object({
  responseTime: z.number().describe("Response time in milliseconds"),
  totalTilesets: z
    .number()
    .optional()
    .describe("Total number of tilesets in the scene"),
});

/**
 * Response schema for tileset_add operations
 */
export const TilesetAddResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  tilesetId: z
    .string()
    .optional()
    .describe("Unique ID assigned to the added tileset"),
  name: z.string().optional().describe("Display name of the added tileset"),
  sourceType: z
    .string()
    .optional()
    .describe("Source type used to load the tileset"),
  stats: TilesStatsSchema,
});

/**
 * Response schema for tileset_remove operations
 */
export const TilesetRemoveResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  removedTilesetId: z.string().optional().describe("ID of the removed tileset"),
  removedName: z.string().optional().describe("Name of the removed tileset"),
  removedCount: z.number().optional().describe("Number of tilesets removed"),
  stats: z.object({
    responseTime: z.number().describe("Response time in milliseconds"),
  }),
});

/**
 * Response schema for tileset_list operations
 */
export const TilesetListResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  tilesets: z.array(TilesetSummarySchema).describe("Array of loaded tilesets"),
  totalCount: z.number().describe("Total number of tilesets in the scene"),
  stats: TilesStatsSchema,
});

// Type exports for TypeScript
export type TilesStats = z.infer<typeof TilesStatsSchema>;
export type TilesetAddResponse = z.infer<typeof TilesetAddResponseSchema>;
export type TilesetRemoveResponse = z.infer<typeof TilesetRemoveResponseSchema>;
export type TilesetListResponse = z.infer<typeof TilesetListResponseSchema>;
