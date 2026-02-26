/**
 * Shared Command Utilities
 * Helper functions for working with MCP commands
 */

import type { MCPCommand, MCPCommandResult } from "../types/mcp.js";

/**
 * Wrap an operation in a try-catch block and return MCPCommandResult
 * Useful for consistent error handling across managers
 */
export function wrapOperation<T extends MCPCommandResult>(
  operation: () => T,
): T | MCPCommandResult {
  try {
    return operation();
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Extract a parameter from MCPCommand with type safety
 * Supports default values if parameter is undefined
 */
export function getParam<T>(cmd: MCPCommand, key: string, defaultValue?: T): T {
  const value = cmd[key];
  if (value === undefined && defaultValue !== undefined) {
    return defaultValue;
  }
  return value as T;
}
