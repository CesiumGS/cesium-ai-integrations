import { CommandInput, CommandResult } from "../index.js";
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
   * @param command The command object to send (id will be auto-assigned)
   * @param timeoutMs Maximum time to wait for response in milliseconds (default: DEFAULT_COMMAND_TIMEOUT_MS)
   * @returns Promise resolving to the command result
   */
  executeCommand(
    command: CommandInput,
    timeoutMs?: number,
  ): Promise<CommandResult>;

  /**
   * Get current server statistics
   * @returns Server statistics including port, client count, and uptime
   */
  getStats(): ServerStats;
}
