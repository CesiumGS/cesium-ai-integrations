/**
 * Communication server constants
 */

/** Default timeout for command execution in milliseconds (10 seconds) */
export const DEFAULT_COMMAND_TIMEOUT_MS = 10000;

/** Heartbeat interval for keeping connections alive in milliseconds (30 seconds) */
export const HEARTBEAT_INTERVAL_MS = 30000;

/** Port offset for MCP transport server relative to communication server port */
export const MCP_PORT_OFFSET = 1000;

/** Default timeout for graceful shutdown in milliseconds (5 seconds) */
export const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5000;

/**
 * Default server configuration values
 */
export const ServerDefaults = {
  COMMAND_TIMEOUT_MS: DEFAULT_COMMAND_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS: HEARTBEAT_INTERVAL_MS,
  PORT_OFFSET: MCP_PORT_OFFSET,
  SHUTDOWN_TIMEOUT_MS: GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  MAX_RETRIES: 10,
  CORS_ORIGIN: "*",
} as const;
