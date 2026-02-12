import { ServerConfig, ServerStats } from "../models/serverConfig.js";

export type CommandPayload = Record<string, unknown> & {
  id?: string;
  type: string;
};

export type CommandResult = {
  success?: boolean;
  error?: string;
  actualDuration?: number;
  position?: {
    longitude: number;
    latitude: number;
    height: number;
  };
  orientation?: {
    heading: number;
    pitch: number;
    roll: number;
  };
  viewRectangle?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  altitude?: number;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface ICommunicationServer {
  /**
   * Start the communication server
   * @param config Server configuration including port and retry settings
   * @returns Promise resolving to the actual port number used
   */
  start(config: ServerConfig): Promise<number>;

  /**
   * Stop the communication server and close all connections
   */
  stop(): Promise<void>;

  /**
   * Execute a command by sending it to the connected client and waiting for response
   * @param command The command object to send
   * @param timeoutMs Maximum time to wait for response in milliseconds (default: 10000)
   * @returns Promise resolving to the command result
   */
  executeCommand(
    command: CommandPayload,
    timeoutMs?: number,
  ): Promise<CommandResult>;

  /**
   * Get current server statistics
   * @returns Server statistics including port, client count, and pending results
   */
  getStats(): ServerStats;
}
