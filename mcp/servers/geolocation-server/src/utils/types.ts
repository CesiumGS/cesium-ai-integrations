/**
 * Type definitions for geolocation server utilities
 */

/**
 * Base structured content interface
 */
export interface StructuredContent {
  success: boolean;
  message: string;
  [key: string]: unknown;
}
