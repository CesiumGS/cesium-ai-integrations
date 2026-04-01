import { z } from "zod";
import { TerrainSummarySchema } from "./core-schemas.js";

export const TerrainStatsSchema = z.object({
  responseTime: z.number().describe("Response time in milliseconds"),
});

export const TerrainSetResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  sourceType: z
    .string()
    .optional()
    .describe("Source type of the terrain provider that was set"),
  name: z.string().optional().describe("Display name of the terrain provider"),
  stats: TerrainStatsSchema,
});

export const TerrainGetResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  terrain: TerrainSummarySchema.optional().describe(
    "Current terrain provider information",
  ),
  stats: TerrainStatsSchema,
});

export const TerrainRemoveResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  previousSourceType: z
    .string()
    .optional()
    .describe("Source type of the terrain provider that was removed"),
  previousName: z
    .string()
    .optional()
    .describe("Display name of the terrain provider that was removed"),
  stats: TerrainStatsSchema,
});

export type TerrainStats = z.infer<typeof TerrainStatsSchema>;
export type TerrainSetResponse = z.infer<typeof TerrainSetResponseSchema>;
export type TerrainGetResponse = z.infer<typeof TerrainGetResponseSchema>;
export type TerrainRemoveResponse = z.infer<typeof TerrainRemoveResponseSchema>;
