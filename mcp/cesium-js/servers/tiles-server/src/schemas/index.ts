/**
 * Centralized schema exports for the tiles server
 *
 * This module re-exports all schemas from their respective files:
 * - core-schemas.ts: Fundamental 3D Tiles data types
 * - tool-schemas.ts: Tool-specific input schemas
 * - response-schemas.ts: Common response patterns
 */

// Core schemas
export {
  TilesetSourceTypeSchema,
  TilesetSummarySchema,
  type TilesetSourceType,
  type TilesetSummary,
} from "./core-schemas.js";

// Tool-specific schemas
export {
  TilesetAddInputSchema,
  TilesetRemoveInputSchema,
  TilesetListInputSchema,
  type TilesetAddInput,
  type TilesetRemoveInput,
  type TilesetListInput,
} from "./tool-schemas.js";

// Response schemas
export {
  TilesStatsSchema,
  TilesetAddResponseSchema,
  TilesetRemoveResponseSchema,
  TilesetListResponseSchema,
  type TilesStats,
  type TilesetAddResponse,
  type TilesetRemoveResponse,
  type TilesetListResponse,
} from "./response-schemas.js";
