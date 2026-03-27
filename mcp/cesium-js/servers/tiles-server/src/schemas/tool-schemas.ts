import { z } from "zod";
import { TilesetSourceTypeSchema } from "./core-schemas.js";

/**
 * Tool-specific input schemas for 3D Tiles operations
 */

/**
 * Input schema for tileset_add tool
 * Adds a new 3D tileset to the scene
 */
export const TilesetAddInputSchema = z.object({
  type: TilesetSourceTypeSchema,
  assetId: z
    .number()
    .optional()
    .describe(
      "Cesium Ion asset ID. Required when type is 'ion'. " +
        "Find asset IDs at https://ion.cesium.com/assets",
    ),
  url: z
    .string()
    .optional()
    .describe(
      "URL of the tileset.json file. Required when type is 'url'. " +
        "Example: https://example.com/tileset/tileset.json",
    ),
  name: z
    .string()
    .optional()
    .describe("Display name for the tileset. Used when listing or removing."),
  show: z
    .boolean()
    .optional()
    .describe("Whether the tileset is visible on load (default: true)"),
});

/**
 * Input schema for tileset_remove tool
 * Removes a 3D tileset from the scene
 */
export const TilesetRemoveInputSchema = z.object({
  tilesetId: z
    .string()
    .optional()
    .describe(
      "Unique tileset ID returned by tileset_add. Preferred removal method.",
    ),
  name: z.string().optional().describe("Display name of the tileset to remove"),
  removeAll: z
    .boolean()
    .optional()
    .describe("Remove all loaded tilesets from the scene"),
});

/**
 * Input schema for tileset_list tool
 * Lists all 3D tilesets currently in the scene
 */
export const TilesetListInputSchema = z.object({
  includeDetails: z
    .boolean()
    .optional()
    .describe("Include detailed source information for each tileset"),
});

// Type exports for TypeScript
export type TilesetAddInput = z.infer<typeof TilesetAddInputSchema>;
export type TilesetRemoveInput = z.infer<typeof TilesetRemoveInputSchema>;
export type TilesetListInput = z.infer<typeof TilesetListInputSchema>;
