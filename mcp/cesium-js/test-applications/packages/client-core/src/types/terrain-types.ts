import type { MCPCommandResult } from "./mcp.js";

export interface TerrainSetResult extends MCPCommandResult {
  sourceType?: string;
  name?: string;
}

export interface TerrainGetResult extends MCPCommandResult {
  terrain?: {
    sourceType: string;
    name?: string;
    assetId?: number;
    url?: string;
    hasVertexNormals?: boolean;
    hasWaterMask?: boolean;
    hasMetadata?: boolean;
  };
}

export interface TerrainRemoveResult extends MCPCommandResult {
  previousSourceType?: string;
  previousName?: string;
}
