import type { TerrainSourceType } from "../schemas/core-schemas.js";
import { formatErrorMessage } from "@cesium-mcp/shared";

export function validateSourceTypeParams(
  sourceType: TerrainSourceType,
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
    case "ellipsoid":
      // No additional params required
      break;
  }
}

export function formatTerrainError(
  error: unknown,
  context: {
    operation: "set" | "get" | "remove";
    identifier?: string;
  },
): string {
  const message = formatErrorMessage(error);
  const id = context.identifier ?? "unknown";

  const prefixes: Record<"set" | "get" | "remove", string> = {
    set: `Failed to set terrain provider '${id}'`,
    get: "Failed to get terrain provider information",
    remove: "Failed to remove terrain provider",
  };

  return `${prefixes[context.operation]}: ${message}`;
}
