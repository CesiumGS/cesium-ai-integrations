import type { MCPCommandResult } from "./mcp.js";

export interface TilesetAddResult extends MCPCommandResult {
  tilesetId?: string;
  name?: string;
  sourceType?: string;
  totalTilesets?: number;
}

export interface TilesetRemoveResult extends MCPCommandResult {
  removedTilesetId?: string;
  removedName?: string;
  removedCount?: number;
}

export interface TilesetInfo {
  tilesetId: string;
  name?: string;
  sourceType: string;
  show: boolean;
  assetId?: number;
  url?: string;
}

export interface TilesetListResult extends MCPCommandResult {
  tilesets?: TilesetInfo[];
  totalCount?: number;
}
