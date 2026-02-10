import { ServerConfig, ServerStats } from "../models/serverConfig.js";

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
  executeCommand(command: any, timeoutMs?: number): Promise<any>;

  /**
   * Get current server statistics
   * @returns Server statistics including port, client count, and pending results
   */
  getStats(): ServerStats;
}
