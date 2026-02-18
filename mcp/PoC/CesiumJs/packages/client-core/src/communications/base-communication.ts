/**
 * Base Communication Manager
 * Abstract base class containing common logic for all communication protocols
 */

import {
  CommunicationManager,
  ConnectionStatus,
  ServerStatus,
} from "../types/communication-manager.js";
import type {
  MCPCommand,
  MCPCommandResult,
  CommandHandler,
  ManagerInterface,
  ServerConfig,
} from "../types/mcp.js";
import { getErrorMessage } from "../shared/error-utils.js";
import {
  DEFAULT_SERVER_CONFIG,
  DEFAULT_RECONNECT_DELAY,
  MAX_RECONNECT_ATTEMPTS,
} from "../shared/constants.js";

/**
 * Abstract base class for communication managers
 */
export abstract class BaseCommunicationManager implements CommunicationManager {
  protected managers: ManagerInterface[];
  protected serverConfig: ServerConfig[];
  protected reconnectDelay: number;
  protected maxReconnectAttempts: number;
  protected reconnectAttempts: Map<number, number>;
  protected commandHandlers: Map<string, CommandHandler>;
  protected baseUrl: string;

  constructor(
    managers: ManagerInterface[] = [],
    serverConfig: ServerConfig[] = [],
  ) {
    this.managers = managers;
    this.serverConfig =
      serverConfig.length > 0 ? serverConfig : [DEFAULT_SERVER_CONFIG];
    this.reconnectDelay = DEFAULT_RECONNECT_DELAY;
    this.maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS;
    this.reconnectAttempts = new Map();
    this.commandHandlers = this.initializeCommandHandlers();
    this.baseUrl = this.getDefaultBaseUrl();
  }

  /**
   * Get the default base URL for the protocol
   * Override in subclasses to provide protocol-specific defaults
   */
  protected abstract getDefaultBaseUrl(): string;

  /**
   * Initialize command handlers map for dynamic routing
   * Collects handlers from all registered managers
   */
  protected initializeCommandHandlers(): Map<string, CommandHandler> {
    const handlers = new Map<string, CommandHandler>();

    // First, set up all managers (this populates their handler maps)
    for (const manager of this.managers) {
      manager.setUp();
    }

    // Then collect handlers from each manager that implements getCommandHandlers()
    for (const manager of this.managers) {
      if (manager && typeof manager.getCommandHandlers === "function") {
        const managerHandlers = manager.getCommandHandlers();
        for (const [commandType, handler] of managerHandlers.entries()) {
          handlers.set(commandType, handler);
        }
      }
    }

    return handlers;
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  protected scheduleReconnect(
    port: number,
    serverName: string,
    useExponentialBackoff: boolean = false,
  ): void {
    const attempts = this.reconnectAttempts.get(port) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${serverName}`);
      return;
    }

    this.reconnectAttempts.set(port, attempts + 1);

    const delay = useExponentialBackoff
      ? this.reconnectDelay * Math.pow(1.5, attempts)
      : this.reconnectDelay;

    setTimeout(() => {
      console.log(
        `🔄 Attempting to reconnect to ${serverName} (attempt ${attempts + 1}/${this.maxReconnectAttempts})...`,
      );
      this.connectToServer(port, serverName).catch((error) => {
        console.error(`🔄 Reconnection failed: ${serverName}`, error);
      });
    }, delay);
  }

  /**
   * Reset reconnection attempt counter for a server
   */
  protected resetReconnectAttempts(port: number): void {
    this.reconnectAttempts.set(port, 0);
  }

  /**
   * Handle command messages from any protocol
   * Processes command and sends result back to server
   */
  protected async handleCommandMessage(
    command: MCPCommand,
    port: number,
  ): Promise<void> {
    const result = await this.handleMCPCommand(command);
    await this.sendCommandResult(command.id!, result, port);
  }

  /**
   * Handle MCP commands by routing to appropriate controllers
   * Generic handler that uses the command handlers map
   */
  protected async handleMCPCommand(
    command: MCPCommand,
  ): Promise<MCPCommandResult> {
    console.log(`🎯 MCP Command received: ${command.type}`, command);
    try {
      const handler = this.commandHandlers.get(command.type);

      if (handler) {
        console.log(`✅ Handler found for: ${command.type}`);
        const result = await handler(command);
        console.log(`✅ Handler result:`, result);
        return result;
      }

      console.error(`❌ No handler found for command type: ${command.type}`);
      console.error(
        `Available handlers:`,
        Array.from(this.commandHandlers.keys()),
      );
      return {
        success: false,
        error: `Unknown command type: ${command.type}`,
      };
    } catch (error: unknown) {
      console.error(`❌ Handler error for ${command.type}:`, error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Initialize connections for all configured servers
   * Generic implementation that delegates to protocol-specific connection logic
   */
  public async connect(): Promise<void> {
    const connectionPromises = this.serverConfig.map((server) =>
      this.connectToServer(server.port, server.name),
    );

    await Promise.allSettled(connectionPromises);
  }

  /**
   * Get connection status for all configured servers
   * Generic implementation that aggregates server-specific status
   */
  public getConnectionStatus(): ConnectionStatus {
    const servers = this.serverConfig.map((server) =>
      this.getServerStatus(server),
    );

    return {
      servers: servers,
      totalServers: this.serverConfig.length,
      connectedServers: servers.filter((s) => s.isConnected).length,
    };
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract connectToServer(
    port: number,
    serverName: string,
  ): Promise<void>;
  protected abstract sendCommandResult(
    commandId: string,
    result: MCPCommandResult,
    port: number,
  ): Promise<void>;
  protected abstract getServerStatus(server: ServerConfig): ServerStatus;
  public abstract disconnect(): void;
}
