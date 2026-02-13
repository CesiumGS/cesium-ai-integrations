/**
 * Command input from external callers (before id assignment)
 */
export type CommandInput = Record<string, unknown> & {
  type: string;
};

/**
 * Command payload with assigned id for execution
 */
export type CommandPayload = CommandInput & {
  id: string;
};

export type CommandResult = {
  success?: boolean;
  error?: string;
  actualDuration?: number;
  [key: string]: unknown;
};

/**
 * Client message types for WebSocket communication
 */
export type ClientMessage =
  | { type: "result"; id: string; result: CommandResult }
  | { type: "pong" };

/**
 * Log levels for internal logging
 */
export type LogLevel = "info" | "warn" | "error" | "debug";
