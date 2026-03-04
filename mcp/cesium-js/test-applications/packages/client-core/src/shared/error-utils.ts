/**
 * Shared Error Handling Utilities
 * Common error handling functions used across the application
 */

/**
 * Extract error message from unknown error type
 * Handles both Error instances and other types safely
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
