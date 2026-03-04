/**
 * Type definitions for entity server communication
 */

import type { Position } from "../schemas/core-schemas.js";
import type { EntitySummary } from "../schemas/response-schemas.js";

/**
 * Base command structure
 */
export interface BaseCommand {
  type: string;
}

/**
 * Command to add an entity to the scene
 */
export interface EntityAddCommand extends BaseCommand {
  type: "entity_add";
  entity: Entity;
}

/**
 * Command to remove an entity from the scene
 */
export interface EntityRemoveCommand extends BaseCommand {
  type: "entity_remove";
  entityId?: string;
  namePattern?: string;
  removeAll?: boolean;
  confirmRemoval?: boolean;
}

/**
 * Command to list entities in the scene
 */
export interface EntityListCommand extends BaseCommand {
  type: "entity_list";
  includeDetails?: boolean;
  filterByType?: string;
}

/**
 * Union type for all entity commands
 */
export type EntityCommand =
  | EntityAddCommand
  | EntityRemoveCommand
  | EntityListCommand;

/**
 * Base result structure
 */
export interface BaseResult {
  success?: boolean;
  error?: string;
}

/**
 * Result from adding an entity
 */
export interface EntityAddResult extends BaseResult {
  totalEntities?: number;
  [key: string]: unknown;
}

/**
 * Result from removing an entity
 */
export interface EntityRemoveResult extends BaseResult {
  removedEntityId?: string;
  removedEntityName?: string;
  removedCount?: number;
  [key: string]: unknown;
}

/**
 * Result from listing entities
 */
export interface EntityListResult extends BaseResult {
  entities?: EntitySummary[];
  [key: string]: unknown;
}

/**
 * Union type for all entity results
 */
export type EntityResult =
  | EntityAddResult
  | EntityRemoveResult
  | EntityListResult;

/**
 * Base entity structure matching CesiumJS Entity format
 */
export interface Entity {
  id: string;
  name: string;
  description?: string;
  position?: Position;
  [key: string]: unknown;
}

/**
 * Entity builder options for consistent entity creation
 */
export interface EntityBuilderOptions {
  id: string;
  name: string;
  description?: string;
  position?: Position;
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
}

/**
 * Success response output structure
 */
export interface EntitySuccessOutput {
  success: true;
  message: string;
  entityId: string;
  entityName: string;
  position?: Position;
  stats: {
    totalEntities: number;
    responseTime: number;
  };
  [key: string]: unknown;
}

/**
 * Error response output structure
 */
export interface EntityErrorOutput {
  success: false;
  message: string;
  entityId?: string;
  stats: {
    responseTime: number;
  };
  [key: string]: unknown;
}

/**
 * Response output (success or error)
 */
export type EntityOutput = EntitySuccessOutput | EntityErrorOutput;
