/**
 * Centralized schema exports for the terrain server
 */

// Core terrain schemas
export {
  TerrainSourceTypeSchema,
  TerrainSummarySchema,
  type TerrainSourceType,
  type TerrainSummary,
} from "./core-schemas.js";

// Tool-specific schemas
export {
  TerrainSetInputSchema,
  TerrainGetInputSchema,
  TerrainRemoveInputSchema,
  type TerrainSetInput,
  type TerrainGetInput,
  type TerrainRemoveInput,
} from "./tool-schemas.js";

// Response schemas
export {
  TerrainStatsSchema,
  TerrainSetResponseSchema,
  TerrainGetResponseSchema,
  TerrainRemoveResponseSchema,
  type TerrainStats,
  type TerrainSetResponse,
  type TerrainGetResponse,
  type TerrainRemoveResponse,
} from "./response-schemas.js";
