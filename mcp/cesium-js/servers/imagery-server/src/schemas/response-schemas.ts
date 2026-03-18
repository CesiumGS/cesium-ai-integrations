import { z } from "zod";
import { ImageryLayerSummarySchema } from "./core-schemas.js";

/**
 * Response schemas for imagery operations
 */

/**
 * Common statistics included in responses
 */
export const StatsSchema = z.object({
  responseTime: z.number().describe("Response time in milliseconds"),
  totalLayers: z.number().optional().describe("Total number of imagery layers"),
});

/**
 * Response schema for imagery add operations
 */
export const ImageryAddResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  layerIndex: z
    .number()
    .optional()
    .describe("Index of the added imagery layer"),
  layerName: z.string().optional().describe("Name of the added imagery layer"),
  providerType: z
    .string()
    .optional()
    .describe("Type of imagery provider created"),
  stats: StatsSchema,
});

/**
 * Response schema for imagery remove operations
 */
export const ImageryRemoveResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  removedIndex: z
    .number()
    .optional()
    .describe("Index of the removed imagery layer"),
  removedName: z
    .string()
    .optional()
    .describe("Name of the removed imagery layer"),
  removedCount: z
    .number()
    .optional()
    .describe("Number of imagery layers removed"),
  stats: z.object({
    responseTime: z.number().describe("Response time in milliseconds"),
  }),
});

/**
 * Response schema for imagery list operations
 */
export const ImageryListResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  layers: z
    .array(ImageryLayerSummarySchema)
    .describe("Array of imagery layers"),
  totalCount: z.number().describe("Total number of imagery layers"),
  stats: StatsSchema,
});

// Type exports for TypeScript
export type Stats = z.infer<typeof StatsSchema>;
export type ImageryAddResponse = z.infer<typeof ImageryAddResponseSchema>;
export type ImageryRemoveResponse = z.infer<typeof ImageryRemoveResponseSchema>;
export type ImageryListResponse = z.infer<typeof ImageryListResponseSchema>;
