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
    .int()
    .positive()
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

/**
 * Input schema for tileset_style tool
 * Applies or updates 3D Tiles styling on a loaded tileset
 */
export const TilesetStyleInputSchema = z.object({
  tilesetId: z
    .string()
    .optional()
    .describe(
      "Unique tileset ID returned by tileset_add. Preferred targeting method.",
    ),
  name: z.string().optional().describe("Display name of the tileset to style"),
  color: z
    .string()
    .optional()
    .describe(
      "Cesium tile style color expression, e.g. \"color('red')\" or \"color('${color}')\". " +
        "Applied as-is when colorConditions is not provided.",
    ),
  colorConditions: z
    .array(z.tuple([z.string(), z.string()]))
    .optional()
    .describe(
      "Array of [condition, color] pairs evaluated top-to-bottom. " +
        "Each condition is a Cesium expression string; the first truthy one applies. " +
        'Example: [["${height} >= 100", "color(\\"blue\\")"], ["true", "color(\\"white\\")"]]',
    ),
  show: z
    .union([z.boolean(), z.string()])
    .optional()
    .describe(
      "Boolean or Cesium expression string to control feature visibility, " +
        'e.g. true or "${height} > 10". Applied when showConditions is not provided.',
    ),
  showConditions: z
    .array(z.tuple([z.string(), z.string()]))
    .optional()
    .describe(
      "Array of [condition, show] pairs evaluated top-to-bottom. " +
        'Example: [["${height} > 10", "true"], ["true", "false"]]',
    ),
});

// Type exports for TypeScript
export type TilesetAddInput = z.infer<typeof TilesetAddInputSchema>;
export type TilesetRemoveInput = z.infer<typeof TilesetRemoveInputSchema>;
export type TilesetListInput = z.infer<typeof TilesetListInputSchema>;
export type TilesetStyleInput = z.infer<typeof TilesetStyleInputSchema>;
