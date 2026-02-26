import type { Position } from "../schemas/core-schemas.js";
import type {
  Entity,
  EntityBuilderOptions,
  EntityAddResult,
  EntitySuccessOutput,
  EntityErrorOutput,
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
 * Generate unique entity ID with prefix
 */
export function generateEntityId(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * Build base entity object with common properties
 */
export function buildBaseEntity(
  options: EntityBuilderOptions,
  graphics: Record<string, unknown>,
  graphicsKey: string,
): Entity {
  const entity: Entity = {
    id: options.id,
    name: options.name,
  };

  if (options.description) {
    entity.description = options.description;
  }

  if (options.position) {
    entity.position = options.position;
  }

  if (options.orientation) {
    entity.orientation = options.orientation;
  }

  entity[graphicsKey] = graphics;

  return entity;
}

/**
 * Execute entity add command with proper typing
 */
export async function executeEntityAddCommand(
  communicationServer: ICommunicationServer,
  entity: Entity,
): Promise<{ result: EntityAddResult; responseTime: number }> {
  const command = {
    type: "entity_add" as const,
    entity,
  };

  return executeWithTiming<EntityAddResult>(communicationServer, command);
}

/**
 * Build success output for entity add operations
 */
export function buildEntitySuccessOutput(
  entityName: string,
  entityId: string,
  position: Position | undefined,
  message: string,
  totalEntities: number,
  responseTime: number,
): EntitySuccessOutput {
  return {
    success: true,
    message,
    entityId,
    entityName,
    position,
    stats: {
      totalEntities,
      responseTime,
    },
  };
}

/**
 * Build error output for entity add operations
 */
export function buildEntityErrorOutput(
  error: unknown,
  entityId: string | undefined,
  operationType: string,
): EntityErrorOutput {
  return {
    success: false,
    message: `Failed to ${operationType}: ${formatErrorMessage(error)}`,
    entityId,
    stats: {
      responseTime: 0,
    },
  };
}

/**
 * Format position message for display
 */
export function formatPositionMessage(position: Position): string {
  return `${position.latitude}°, ${position.longitude}°`;
}

/**
 * Generic handler for entity add operations
 * Reduces duplication across all entity add tools
 */
export async function handleEntityAdd(
  communicationServer: ICommunicationServer,
  entity: Entity,
  entityType: string,
  emoji: ResponseEmoji,
  successMessageFn: () => string,
  entityId?: string,
): Promise<{
  [x: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  structuredContent: EntitySuccessOutput | EntityErrorOutput;
  isError: boolean;
}> {
  try {
    const { result, responseTime } = await executeEntityAddCommand(
      communicationServer,
      entity,
    );

    if (result.success) {
      const output = buildEntitySuccessOutput(
        entity.name as string,
        entity.id as string,
        entity.position as Position | undefined,
        successMessageFn(),
        result.totalEntities || 0,
        responseTime,
      );

      return buildSuccessResponse(emoji, responseTime, output);
    }

    throw new Error(result.error || "Unknown error from Cesium");
  } catch (error) {
    const errorOutput = buildEntityErrorOutput(
      error,
      entityId,
      `add ${entityType} entity`,
    );

    return buildErrorResponse(0, errorOutput);
  }
}

/**
 * Calculate center position from an array of positions
 */
export function calculateCenterPosition(positions: Position[]): Position {
  if (positions.length === 0) {
    return { latitude: 0, longitude: 0, height: 0 };
  }

  const centerLat =
    positions.reduce((sum, pos) => sum + pos.latitude, 0) / positions.length;
  const centerLon =
    positions.reduce((sum, pos) => sum + pos.longitude, 0) / positions.length;

  // Average height if available
  const heights = positions
    .map((pos) => pos.height)
    .filter((h): h is number => h !== undefined);
  const centerHeight =
    heights.length > 0
      ? heights.reduce((sum, h) => sum + h, 0) / heights.length
      : undefined;

  return {
    latitude: centerLat,
    longitude: centerLon,
    height: centerHeight,
  };
}

/**
 * Format multiple positions for display
 */
export function formatMultiplePositions(
  positions: Position[],
  maxDisplay: number = 2,
): string {
  if (positions.length === 0) {
    return "no positions";
  }
  if (positions.length === 1) {
    return formatPositionMessage(positions[0]);
  }

  const displayed = positions
    .slice(0, maxDisplay)
    .map(formatPositionMessage)
    .join(" to ");

  if (positions.length > maxDisplay) {
    return `${displayed} (${positions.length} total points)`;
  }

  return displayed;
}
