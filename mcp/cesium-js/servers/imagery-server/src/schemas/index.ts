/**
 * Centralized schema exports for the imagery server
 *
 * This module re-exports all schemas from their respective files:
 * - core-schemas.ts: Fundamental imagery data types
 * - tool-schemas.ts: Tool-specific input schemas
 * - response-schemas.ts: Common response patterns
 */

// Core imagery schemas
export {
  ImageryProviderTypeSchema,
  ImageryRectangleSchema,
  ImageryLayerSummarySchema,
  type ImageryProviderType,
  type ImageryRectangle,
  type ImageryLayerSummary,
} from "./core-schemas.js";

// Tool-specific schemas
export {
  ImageryAddInputSchema,
  ImageryRemoveInputSchema,
  ImageryListInputSchema,
  type ImageryAddInput,
  type ImageryRemoveInput,
  type ImageryListInput,
} from "./tool-schemas.js";

// Response schemas
export {
  StatsSchema,
  ImageryAddResponseSchema,
  ImageryRemoveResponseSchema,
  ImageryListResponseSchema,
  type Stats,
  type ImageryAddResponse,
  type ImageryRemoveResponse,
  type ImageryListResponse,
} from "./response-schemas.js";
