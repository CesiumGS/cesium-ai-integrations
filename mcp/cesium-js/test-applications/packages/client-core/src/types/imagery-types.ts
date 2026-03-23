import type { MCPCommandResult } from "./mcp.js";

export interface ImageryAddResult extends MCPCommandResult {
  layerIndex?: number;
  layerName?: string;
  providerType?: string;
  totalLayers?: number;
}

export interface ImageryRemoveResult extends MCPCommandResult {
  removedIndex?: number;
  removedName?: string;
  removedCount?: number;
  totalLayers?: number;
}

export interface ImageryLayerInfo {
  index: number;
  name: string;
  show: boolean;
  alpha: number;
  providerType?: string;
  url?: string;
  ready?: boolean;
}

export interface ImageryListResult extends MCPCommandResult {
  layers?: ImageryLayerInfo[];
  totalCount?: number;
}
