/**
 * Reusable WebSocket viewer client that simulates a Cesium viewer connected to
 * an MCP server. Receives commands, dispatches them to the provided manager's
 * command handlers, and sends results back.
 *
 * Works with any manager that implements ManagerInterface (camera, entity,
 * animation, etc.).
 *
 * Usage:
 *   const manager = new CesiumCameraManager(viewer);
 *   const client = new TestViewerClient(manager, 'ws://localhost:4003/mcp/ws');
 *   await client.waitForConnection();
 *   await client.setUp();
 */

import type {
  MCPCommand,
  MCPCommandResult,
  ManagerInterface,
} from "../../src/types/mcp";
import type { ITestViewerClient } from "./ITestViewerClient";

export class TestWSViewerClient implements ITestViewerClient {
  private commandsReceived: MCPCommand[] = [];
  private ws: WebSocket | null = null;
  private connectionReady: Promise<void>;
  private resolveConnection!: () => void;
  private rejectConnection!: (error: Error) => void;
  /** True once the server has sent its "connected" confirmation message. */
  private connectionConfirmed = false;
  /** Resolved by the onclose handler when the socket fully closes. */
  private _resolveDisconnect: (() => void) | null = null;

  constructor(
    private manager: ManagerInterface,
    serverUrl: string,
  ) {
    this.connectionReady = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });

    this.connectToServer(serverUrl);
  }

  private connectToServer(serverUrl: string): void {
    try {
      this.ws = new WebSocket(serverUrl);

      this.ws.onopen = () => {
        console.log(
          "[Viewer] WebSocket open — waiting for server confirmation",
        );
      };

      this.ws.onmessage = async (event: MessageEvent) => {
        try {
          const message = JSON.parse(
            typeof event.data === "string" ? event.data : event.data.toString(),
          );

          if (message.type === "command" && message.command) {
            const command = message.command as MCPCommand;
            this.commandsReceived.push(command);
            await this.handleCommand(command);
          } else if (message.type === "connected") {
            // Server has acknowledged this connection — safe to proceed.
            console.log("[Viewer] Server confirmed connection");
            this.connectionConfirmed = true;
            this.resolveConnection();
          } else if (message.type === "ping") {
            // Respond to ping with pong
            this.ws?.send(JSON.stringify({ type: "pong" }));
          }
        } catch (error) {
          console.error("[Viewer] Error handling message:", error);
        }
      };

      this.ws.onerror = (_event: Event) => {
        console.error("[Viewer] WebSocket error");
        if (!this.connectionConfirmed) {
          this.rejectConnection(new Error("WebSocket connection failed"));
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log("[Viewer] WebSocket connection closed");
        // If the server closes before ever sending "connected" (e.g. it
        // rejected the connection because a previous client was still
        // registered), surface that as a connection error.
        if (!this.connectionConfirmed) {
          this.rejectConnection(
            new Error(
              `Connection rejected by server (code ${event.code}: ${event.reason})`,
            ),
          );
        }
        this._resolveDisconnect?.();
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!this.connectionConfirmed) {
          this.rejectConnection(
            new Error('Connection timeout — server never sent "connected"'),
          );
        }
      }, 5000);
    } catch (error) {
      this.rejectConnection(error as Error);
    }
  }

  async waitForConnection(): Promise<void> {
    return this.connectionReady;
  }

  async setUp(): Promise<void> {
    await this.manager.setUp();
  }

  /**
   * Execute the command on the viewer and send the result back to the server
   */
  private async handleCommand(command: MCPCommand): Promise<void> {
    const handlers = this.manager.getCommandHandlers();
    const handler = handlers.get(command.type);

    let result: MCPCommandResult;

    if (handler) {
      try {
        result = await handler(command);
      } catch (error) {
        result = {
          success: false,
          error: `Handler error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    } else {
      result = {
        success: false,
        error: `No handler for command type: ${command.type}`,
      };
    }

    // Send result back to server so the MCP tool call can complete
    if (this.ws && this.ws.readyState === WebSocket.OPEN && command.id) {
      this.ws.send(
        JSON.stringify({
          type: "result",
          id: command.id,
          result,
        }),
      );
    }
  }

  getCommandsReceived(): MCPCommand[] {
    return [...this.commandsReceived];
  }

  clearCommandHistory(): void {
    this.commandsReceived = [];
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): Promise<void> {
    this.manager.shutdown();

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this._resolveDisconnect = resolve;
      this.ws!.close();
      this.ws = null;
    });
  }

  /**
   * Access the underlying manager (for test assertions on manager-specific state)
   */
  getManager<T extends ManagerInterface>(): T {
    return this.manager as T;
  }
}
