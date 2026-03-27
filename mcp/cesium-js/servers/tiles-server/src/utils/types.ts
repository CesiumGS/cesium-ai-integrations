import type { TilesetSummary } from "../schemas/core-schemas.js";

/**
 * Type definitions for tiles server communication
 */

export interface BaseResult {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface TilesetAddResult extends BaseResult {
  tilesetId?: string;
  name?: string;
  sourceType?: string;
  totalTilesets?: number;
  [key: string]: unknown;
}

export interface TilesetRemoveResult extends BaseResult {
  removedTilesetId?: string;
  removedName?: string;
  removedCount?: number;
  [key: string]: unknown;
}

export interface TilesetListResult extends BaseResult {
  tilesets?: TilesetSummary[];
  totalCount?: number;
  [key: string]: unknown;
}

export type TilesResult =
  | TilesetAddResult
  | TilesetRemoveResult
  | TilesetListResult;
