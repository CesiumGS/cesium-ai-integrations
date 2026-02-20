/**
 * Model Registry
 * Centralized registry of default 3D model URLs for animations
 */

import { DEFAULT_MODEL_REGISTRY } from "./constants.js";
import type { ModelPresetType, ModelEntry } from "./types.js";

/**
 * Get model URI from preset name
 * @param preset - Model preset name
 * @returns Model URI
 * @throws Error if preset is not found
 */
export function getModelUri(preset: ModelPresetType): string {
  const modelEntry = DEFAULT_MODEL_REGISTRY[preset];
  if (!modelEntry) {
    throw new Error(`Unknown model preset: ${preset}`);
  }
  return modelEntry.uri;
}

/**
 * Resolve model URI from preset or custom URI
 * @param preset - Model preset name (optional)
 * @param customUri - Custom model URI (optional)
 * @returns Resolved model URI
 * @throws Error if neither preset nor customUri is provided, or if preset is invalid
 */
export function resolveModelUri(preset?: ModelPresetType, customUri?: string): string {
  // Custom URI takes precedence
  if (customUri) {
    return customUri;
  }
  
  // Use preset if provided
  if (preset) {
    return getModelUri(preset);
  }
  
  throw new Error('Must provide either modelPreset or modelUri');
}

/**
 * Check if a preset exists in the registry
 * @param preset - Model preset name to check
 * @returns True if preset exists
 */
export function isValidModelPreset(preset: string): preset is ModelPresetType {
  return preset in DEFAULT_MODEL_REGISTRY;
}

/**
 * Get all available model presets
 * @returns Array of available preset names
 */
export function getAvailablePresets(): ModelPresetType[] {
  return Object.keys(DEFAULT_MODEL_REGISTRY) as ModelPresetType[];
}

/**
 * Get model entry with full details
 * @param preset - Model preset name
 * @returns Model entry or undefined if not found
 */
export function getModelEntry(preset: ModelPresetType): ModelEntry | undefined {
  return DEFAULT_MODEL_REGISTRY[preset];
}
