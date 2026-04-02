import type { TilesetSourceType } from "../schemas/core-schemas.js";
import { formatErrorMessage } from "@cesium-mcp/shared";

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
 * Handle and format errors into tileset response format
 */
export function formatTilesetError(
  error: unknown,
  context: {
    operation: "add" | "remove" | "list" | "style";
    identifier?: string;
  },
): string {
  const message = formatErrorMessage(error);
  const id = context.identifier ?? "unknown";

  const prefixes: Record<"add" | "remove" | "list" | "style", string> = {
    add: "Failed to add 3D tileset",
    remove: `Failed to remove 3D tileset '${id}'`,
    list: "Failed to list 3D tilesets",
    style: `Failed to style 3D tileset '${id}'`,
  };

  return `${prefixes[context.operation]}: ${message}`;
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
