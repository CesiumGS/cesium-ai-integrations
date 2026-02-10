/**
 * Input Validation Utilities
 * Helper functions for validating coordinates and positions
 */

import type { Position } from '../types/mcp.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate longitude value
 */
export function validateLongitude(lon: number): ValidationResult {
  if (!isFinite(lon)) {
    return { valid: false, error: 'Longitude must be a finite number' };
  }
  if (lon < -180 || lon > 180) {
    return { valid: false, error: `Longitude ${lon} out of range [-180, 180]` };
  }
  return { valid: true };
}

/**
 * Validate latitude value
 */
export function validateLatitude(lat: number): ValidationResult {
  if (!isFinite(lat)) {
    return { valid: false, error: 'Latitude must be a finite number' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: `Latitude ${lat} out of range [-90, 90]` };
  }
  return { valid: true };
}

/**
 * Validate height value
 */
export function validateHeight(height: number): ValidationResult {
  if (!isFinite(height)) {
    return { valid: false, error: 'Height must be a finite number' };
  }
  return { valid: true };
}

/**
 * Validate position object
 */
export function validatePosition(position: Position): ValidationResult {
  const lonCheck = validateLongitude(position.longitude);
  if (!lonCheck.valid) return lonCheck;
  
  const latCheck = validateLatitude(position.latitude);
  if (!latCheck.valid) return latCheck;
  
  if (position.height !== undefined) {
    const heightCheck = validateHeight(position.height);
    if (!heightCheck.valid) return heightCheck;
  }
  
  return { valid: true };
}

/**
 * Validate an array of positions
 */
export function validatePositions(positions: Position[]): ValidationResult {
  if (!Array.isArray(positions)) {
    return { valid: false, error: 'Positions must be an array' };
  }
  
  if (positions.length === 0) {
    return { valid: false, error: 'Positions array cannot be empty' };
  }
  
  for (let i = 0; i < positions.length; i++) {
    const result = validatePosition(positions[i]);
    if (!result.valid) {
      return { valid: false, error: `Position at index ${i}: ${result.error}` };
    }
  }
  
  return { valid: true };
}
