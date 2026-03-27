import type { TilesetSourceType } from "../schemas/core-schemas.js";
import type {
  TilesetAddResult,
  TilesetRemoveResult,
  TilesetListResult,
} from "./types.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
  type ICommunicationServer,
} from "@cesium-mcp/shared";

/**
 * Validate that required parameters are present for the given source type
 * @throws {Error} if required parameters are missing
 */
export function validateSourceTypeParams(
  sourceType: TilesetSourceType,
  params: {
    assetId?: number;
    url?: string;
  },
): void {
  switch (sourceType) {
    case "ion":
      if (params.assetId === undefined) {
        throw new Error("assetId is required when type is 'ion'");
      }
      break;
    case "url":
      if (!params.url) {
        throw new Error("url is required when type is 'url'");
      }
      break;
  }
}

/**
 * Execute tileset add command with proper timing and error handling
 */
export async function executeTilesetAddCommand(
  communicationServer: ICommunicationServer,
  command: {
    type: "tileset_add";
    sourceType: TilesetSourceType;
    assetId?: number;
    url?: string;
    name?: string;
    show?: boolean;
  },
): Promise<{ result: TilesetAddResult; responseTime: number }> {
  return executeWithTiming<TilesetAddResult>(communicationServer, command);
}

/**
 * Execute tileset remove command with proper timing and error handling
 */
export async function executeTilesetRemoveCommand(
  communicationServer: ICommunicationServer,
  command: {
    type: "tileset_remove";
    tilesetId?: string;
    name?: string;
    removeAll?: boolean;
  },
): Promise<{ result: TilesetRemoveResult; responseTime: number }> {
  return executeWithTiming<TilesetRemoveResult>(communicationServer, command);
}

/**
 * Execute tileset list command with proper timing and error handling
 */
export async function executeTilesetListCommand(
  communicationServer: ICommunicationServer,
  command: {
    type: "tileset_list";
    includeDetails?: boolean;
  },
): Promise<{ result: TilesetListResult; responseTime: number }> {
  return executeWithTiming<TilesetListResult>(communicationServer, command);
}

/**
 * Build a success response for tileset operations
 */
export function buildTilesetSuccessResponse(
  message: string,
  output: Record<string, unknown> & { message: string },
  responseTime: number,
) {
  return buildSuccessResponse(ResponseEmoji.Success, responseTime, output);
}

/**
 * Build an error response for tileset operations
 */
export function buildTilesetErrorResponse(
  output: Record<string, unknown> & { message: string },
) {
  return buildErrorResponse(0, output);
}

/**
 * Handle and format errors into tileset response format
 */
export function formatTilesetError(
  error: unknown,
  context: {
    operation: "add" | "remove" | "list";
    identifier?: string;
  },
): { message: string; formatted: string } {
  const message = formatErrorMessage(error);
  let formatted: string;

  switch (context.operation) {
    case "add":
      formatted = `Failed to add 3D tileset: ${message}`;
      break;
    case "remove": {
      const id = context.identifier || "unknown";
      formatted = `Failed to remove 3D tileset '${id}': ${message}`;
      break;
    }
    case "list":
      formatted = `Failed to list 3D tilesets: ${message}`;
      break;
  }

  return { message, formatted };
}

/**
 * Get a plural-aware message for tileset counts
 */
export function getTilesetCountMessage(
  count: number,
  prefix: string = "Found",
): string {
  const plural = count === 1 ? "" : "s";
  return `${prefix} ${count} tileset${plural}`;
}

/**
 * Get a plural-aware message for removed tilesets
 */
export function getRemovalCountMessage(count: number | undefined): string {
  const actualCount = count ?? 0;
  const plural = actualCount === 1 ? "" : "s";
  return `Removed ${actualCount} tileset${plural}`;
}
