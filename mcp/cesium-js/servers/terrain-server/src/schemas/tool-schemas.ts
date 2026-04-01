import { z } from "zod";
import { TerrainSourceTypeSchema } from "./core-schemas.js";

/**
 * Input schema for terrain_set tool
 */
export const TerrainSetInputSchema = z.object({
  type: TerrainSourceTypeSchema,
  assetId: z
    .number()
    .optional()
    .describe("Cesium Ion asset ID. Required when type is 'ion'"),
  url: z
    .string()
    .optional()
    .describe(
      "URL to a terrain server (e.g., quantized-mesh endpoint). Required when type is 'url'",
    ),
  name: z
    .string()
    .optional()
    .describe("Optional display name for the terrain provider"),
  requestVertexNormals: z
    .boolean()
    .optional()
    .describe(
      "Whether to request vertex normals for lighting. Default: true for ion/url",
    ),
  requestWaterMask: z
    .boolean()
    .optional()
    .describe(
      "Whether to request water mask data for water effects. Default: false",
    ),
  requestMetadata: z
    .boolean()
    .optional()
    .describe("Whether to request terrain metadata. Default: true"),
});

/**
 * Input schema for terrain_get tool
 */
export const TerrainGetInputSchema = z.object({});

/**
 * Input schema for terrain_remove tool
 */
export const TerrainRemoveInputSchema = z.object({});

export type TerrainSetInput = z.infer<typeof TerrainSetInputSchema>;
export type TerrainGetInput = z.infer<typeof TerrainGetInputSchema>;
export type TerrainRemoveInput = z.infer<typeof TerrainRemoveInputSchema>;
