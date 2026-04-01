import { z } from "zod";

/**
 * Supported terrain provider source types in CesiumJS
 */
export const TerrainSourceTypeSchema = z
  .enum(["ion", "url", "ellipsoid"])
  .describe(
    "Source type: 'ion' for Cesium Ion assets, 'url' for direct terrain server URLs, 'ellipsoid' for flat WGS84 ellipsoid",
  );

/**
 * Summary of current terrain provider state
 */
export const TerrainSummarySchema = z.object({
  sourceType: z.string().describe("Current terrain provider source type"),
  name: z.string().optional().describe("Display name of the terrain provider"),
  assetId: z
    .number()
    .optional()
    .describe("Cesium Ion asset ID if loaded from Ion"),
  url: z.string().optional().describe("Terrain server URL if loaded from URL"),
  hasVertexNormals: z
    .boolean()
    .optional()
    .describe("Whether vertex normals are available"),
  hasWaterMask: z
    .boolean()
    .optional()
    .describe("Whether water mask data is available"),
  hasMetadata: z
    .boolean()
    .optional()
    .describe("Whether terrain metadata is available"),
});

export type TerrainSourceType = z.infer<typeof TerrainSourceTypeSchema>;
export type TerrainSummary = z.infer<typeof TerrainSummarySchema>;
