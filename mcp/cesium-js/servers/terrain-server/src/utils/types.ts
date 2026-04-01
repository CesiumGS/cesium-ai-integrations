import type { TerrainSummary } from "../schemas/core-schemas.js";

export interface BaseResult {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface TerrainSetResult extends BaseResult {
  sourceType?: string;
  name?: string;
  [key: string]: unknown;
}

export interface TerrainGetResult extends BaseResult {
  terrain?: TerrainSummary;
  [key: string]: unknown;
}

export interface TerrainRemoveResult extends BaseResult {
  previousSourceType?: string;
  previousName?: string;
  [key: string]: unknown;
}

export type TerrainResult =
  | TerrainSetResult
  | TerrainGetResult
  | TerrainRemoveResult;
