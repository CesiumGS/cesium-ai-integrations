/**
 * WebSocket Communication Manager
 * Handles WebSocket bidirectional communication with MCP servers
 */

import { BaseCommunicationManager } from "./base-communication.js";
import type {
  MCPCommand,
  MCPCommandResult,
  ManagerInterface,
  ServerConfig,
} from "../types/mcp.js";

interface WSMessage {
  type: "connected" | "command" | "ping";
  command?: MCPCommand;
  message?: string;
}

type WSOutboundMessage =
  | { type: "pong" }
  | { type: "result"; id: string; result: MCPCommandResult };

class WebSocketCommunicationManager extends BaseCommunicationManager {
  private wsConnections: Map<number, WebSocket>;
  private reconnectAttempts: Map<number, number>;
  private maxReconnectAttempts: number;

  constructor(
    managers: ManagerInterface[] = [],
    serverConfig: ServerConfig[] = [],
  ) {
    super(managers, serverConfig);
    this.wsConnections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 10;
  }

  protected getDefaultBaseUrl(): string {
    const configUrl = window.CONFIG?.MCP_BASE_URL || "http://localhost";
    // Convert http/https to ws/wss
    return configUrl.replace(/^http/, "ws");
  }

  /**
   * Establish WebSocket connection for a specific server
   */
  protected async connectToServer(
    port: number,
    serverName: string = "MCP Server",
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        const existingConnection = this.wsConnections.get(port);
        if (existingConnection) {
          existingConnection.close();
        }

        // Create new WebSocket connection
        const ws = new WebSocket(`${this.baseUrl}:${port}/mcp/ws`);
        this.wsConnections.set(port, ws);

        ws.onopen = () => {
          console.log(`✅ WebSocket connected: ${serverName} (port ${port})`);
          this.reconnectAttempts.set(port, 0);
          resolve();
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data) as WSMessage;
            await this.handleWSMessage(data, port);
          } catch (error) {
            console.error(
              `❌ Error processing WebSocket message from ${serverName}:`,
              error,
            );
          }
        };

        ws.onerror = (error) => {
          console.error(
            `❌ WebSocket error: ${serverName} (port ${port})`,
            error,
          );
        };

        ws.onclose = () => {
          console.error(
            `❌ WebSocket connection closed: ${serverName} (port ${port})`,
          );

          // Attempt reconnection with exponential backoff
          const attempts = this.reconnectAttempts.get(port) || 0;
          if (attempts < this.maxReconnectAttempts) {
            this.reconnectAttempts.set(port, attempts + 1);
            const delay = this.reconnectDelay * Math.pow(1.5, attempts);

            setTimeout(() => {
              console.log(
                `🔄 Attempting to reconnect to ${serverName} (attempt ${attempts + 1}/${this.maxReconnectAttempts})...`,
              );
              this.connectToServer(port, serverName).catch((error) => {
                console.error(
                  `🔄 WebSocket reconnection failed: ${serverName}`,
                  error,
                );
              });
            }, delay);
          } else {
            console.error(
              `❌ Max reconnection attempts reached for ${serverName}`,
            );
          }

          reject(new Error(`WebSocket connection failed: ${serverName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWSMessage(data: WSMessage, port: number): Promise<void> {
    switch (data.type) {
      case "connected":
        console.log(`🔌 WebSocket handshake complete for port ${port}`);
        break;

      case "command":
        if (data.command) {
          await this.handleCommandMessage(data.command, port);
        }
        break;

      case "ping":
        // Respond to ping with pong
        this.sendMessage(port, { type: "pong" });
        break;

      default:
        console.warn(`⚠️ Unknown WebSocket message type: ${data.type}`);
        break;
    }
  }

  /**
   * Send a message to a specific server
   */
  private sendMessage(port: number, message: WSOutboundMessage): void {
    const ws = this.wsConnections.get(port);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error(
        `❌ Cannot send message: WebSocket not connected for port ${port}`,
      );
    }
  }

  /**
   * Send command result back to MCP server via WebSocket
   */
  protected async sendCommandResult(
    commandId: string,
    result: MCPCommandResult,
    port: number,
  ): Promise<void> {
    this.sendMessage(port, {
      type: "result",
      id: commandId,
      result: result,
    });
  }

  /**
   * Disconnect from all MCP servers
   */
  public disconnect(): void {
    for (const ws of this.wsConnections.values()) {
      ws.close(1000, "Client disconnect");
    }

    this.wsConnections.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Get connection status for a specific server
   */
  protected getServerStatus(server: ServerConfig) {
    const connection = this.wsConnections.get(server.port);
    const isConnected = !!(
      connection && connection.readyState === WebSocket.OPEN
    );

    return {
      name: server.name,
      port: server.port,
      capabilities: server.capabilities,
      isConnected: isConnected,
      readyState: connection
        ? this.getReadyStateString(connection.readyState)
        : "not initialized",
      reconnectAttempts: this.reconnectAttempts.get(server.port) || 0,
    };
  }

  private getReadyStateString(state: number): string {
    switch (state) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }
}

export default WebSocketCommunicationManager;
