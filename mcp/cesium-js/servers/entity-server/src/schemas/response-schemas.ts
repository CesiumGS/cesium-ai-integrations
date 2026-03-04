import { z } from "zod";
import { PositionSchema } from "./core-schemas.js";

/**
 * Response schemas for entity operations
 */

/**
 * Common statistics included in responses
 */
export const StatsSchema = z.object({
  responseTime: z.number().describe("Response time in milliseconds"),
  totalEntities: z
    .number()
    .optional()
    .describe("Total number of entities in scene"),
});

/**
 * Standard response for entity operations
 */
export const EntityResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  entityId: z.string().optional().describe("ID of affected entity"),
  entityName: z.string().optional().describe("Name of affected entity"),
  position: PositionSchema.optional().describe("Entity position"),
  stats: StatsSchema,
});

/**
 * Entity summary for list operations
 */
export const EntitySummarySchema = z.object({
  id: z.string().describe("Entity ID"),
  name: z.string().optional().describe("Entity name"),
  type: z.string().describe("Entity type"),
  position: PositionSchema.optional().describe("Entity position"),
});

/**
 * Response for entity list operations
 */
export const EntityListResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  entities: z.array(EntitySummarySchema).describe("Array of entities"),
  totalCount: z.number().describe("Total number of entities"),
  filteredCount: z.number().describe("Number of entities after filtering"),
  stats: StatsSchema,
});

/**
 * Response for entity removal operations
 */
export const RemoveEntityResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  removedEntityId: z.string().optional().describe("ID of removed entity"),
  removedEntityName: z.string().optional().describe("Name of removed entity"),
  removedCount: z.number().optional().describe("Number of entities removed"),
  stats: z.object({
    responseTime: z.number().describe("Response time in milliseconds"),
  }),
});

// Type exports
export type Stats = z.infer<typeof StatsSchema>;
export type EntityResponse = z.infer<typeof EntityResponseSchema>;
export type EntitySummary = z.infer<typeof EntitySummarySchema>;
export type EntityListResponse = z.infer<typeof EntityListResponseSchema>;
export type RemoveEntityResponse = z.infer<typeof RemoveEntityResponseSchema>;
