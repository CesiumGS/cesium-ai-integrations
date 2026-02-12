/**
 * SSE Communication Manager
 * Handles Server-Sent Events and HTTP communication with MCP servers
 */

import { BaseCommunicationManager } from "./base-communication.js";
import type {
  MCPCommand,
  MCPCommandResult,
  ManagerInterface,
  ServerConfig,
} from "../types/mcp.js";

interface SSEMessage {
  type: "connected" | "command" | "heartbeat";
  command?: MCPCommand;
  message?: string;
}

class SSECommunicationManager extends BaseCommunicationManager {
  private sseConnections: Map<number, EventSource>;

  constructor(
    managers: ManagerInterface[] = [],
    serverConfig: ServerConfig[] = [],
  ) {
    super(managers, serverConfig);
    this.sseConnections = new Map();
  }

  protected getDefaultBaseUrl(): string {
    return window.CONFIG?.MCP_BASE_URL || "http://localhost";
  }

  /**
   * Establish Server-Sent Events connection for a specific server
   */
  protected async connectToServer(
    port: number,
    serverName: string = "MCP Server",
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        const existingConnection = this.sseConnections.get(port);
        if (existingConnection) {
          existingConnection.close();
        }

        // Create new SSE connection
        const eventSource = new EventSource(
          `${this.baseUrl}:${port}/mcp/events`,
        );
        this.sseConnections.set(port, eventSource);

        eventSource.onopen = () => {
          resolve();
        };

        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data) as SSEMessage;
            await this.handleSSEMessage(data, port);
          } catch (error) {
            console.error(
              `❌ Error processing SSE message from ${serverName}:`,
              error,
            );
          }
        };

        eventSource.onerror = () => {
          console.error(
            `❌ SSE connection error: ${serverName} (port ${port})`,
          );

          // Don't delete from map - keep it so status shows as disconnected
          // The readyState will be CLOSED (2) or CONNECTING (0)

          // Attempt reconnection after delay
          setTimeout(() => {
            console.log(`🔄 Attempting to reconnect to ${serverName}...`);
            this.connectToServer(port, serverName).catch((error) => {
              console.error(`🔄 SSE reconnection failed: ${serverName}`, error);
            });
          }, this.reconnectDelay);

          reject(new Error(`SSE connection failed: ${serverName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming SSE messages
   */
  private async handleSSEMessage(
    data: SSEMessage,
    port: number,
  ): Promise<void> {
    switch (data.type) {
      case "connected":
        break;

      case "command":
        if (data.command) {
          await this.handleCommandMessage(data.command, port);
        }
        break;

      case "heartbeat":
        break;

      default:
        break;
    }
  }

  /**
   * Send command result back to MCP server via HTTP POST
   */
  protected async sendCommandResult(
    commandId: string,
    result: MCPCommandResult,
    port: number,
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}:${port}/mcp/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: commandId,
          result: result,
        }),
      });
    } catch {
      // Silently fail - server may be down
    }
  }

  /**
   * Disconnect from all MCP servers
   */
  public disconnect(): void {
    for (const eventSource of this.sseConnections.values()) {
      eventSource.close();
    }

    this.sseConnections.clear();
  }

  /**
   * Get connection status for a specific server
   */
  protected getServerStatus(server: ServerConfig) {
    const connection = this.sseConnections.get(server.port);
    // EventSource.OPEN = 1, EventSource.CONNECTING = 0, EventSource.CLOSED = 2
    const isConnected = !!(connection && connection.readyState === 1);

    return {
      name: server.name,
      port: server.port,
      capabilities: server.capabilities,
      isConnected: isConnected,
      readyState: connection ? connection.readyState : "not initialized",
    };
  }
}

export default SSECommunicationManager;
