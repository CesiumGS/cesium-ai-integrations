import type { ImageryLayerSummary } from "../schemas/core-schemas.js";

/**
 * Type definitions for imagery server communication
 */

/**
 * Base result structure
 */
export interface BaseResult {
  success?: boolean;
  error?: string;
}

/**
 * Result from adding an imagery layer
 */
export interface ImageryAddResult extends BaseResult {
  layerIndex?: number;
  layerName?: string;
  totalLayers?: number;
  [key: string]: unknown;
}

/**
 * Result from removing an imagery layer
 */
export interface ImageryRemoveResult extends BaseResult {
  removedIndex?: number;
  removedName?: string;
  removedCount?: number;
  [key: string]: unknown;
}

/**
 * Result from listing imagery layers
 */
export interface ImageryListResult extends BaseResult {
  layers?: ImageryLayerSummary[];
  [key: string]: unknown;
}

/**
 * Union type for all imagery results
 */
export type ImageryResult =
  | ImageryAddResult
  | ImageryRemoveResult
  | ImageryListResult;
