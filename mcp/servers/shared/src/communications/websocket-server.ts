import { WebSocketServer, WebSocket } from "ws";
import { createServer, Server as HttpServer } from "http";
import { BaseCommunicationServer } from "./baseCommunicationServer.js";
import type { ClientMessage } from "../index.js";

export class CesiumWebSocketServer extends BaseCommunicationServer {
  private httpServer?: HttpServer;
  private wss?: WebSocketServer;
  private wsClient?: WebSocket;

  protected override getServerToStart() {
    // Create HTTP server only
    // WebSocket server will be created after port is successfully bound
    this.httpServer = createServer(this.app);
    return this.httpServer;
  }

  protected override onServerStarted(): void {
    // Create WebSocket server after HTTP server successfully binds to port
    if (!this.httpServer) {
      throw new Error("HTTP server not initialized");
    }

    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: "/mcp/ws",
    });

    // Setup WebSocket handlers
    this.setupWebSocket();
  }

  protected override getProtocolName(): string {
    return "WebSocket";
  }

  private setupWebSocket(): void {
    if (!this.httpServer || !this.wss) {
      return;
    }

    this.wss.on("connection", (ws: WebSocket) => {
      // Only allow one client connection
      if (this.isClientConnected()) {
        ws.close(
          1008,
          "A client is already connected. Only one client is supported per MCP server instance.",
        );
        this.log(
          "warn",
          "WebSocket connection rejected: client already connected",
        );
        return;
      }

      this.wsClient = ws;
      this.log("info", "WebSocket client connected");

      // Send initial connection message
      ws.send(
        JSON.stringify({
          type: "connected",
          message: "WebSocket connection established",
        }),
      );

      // Handle incoming messages
      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as ClientMessage;
          this.handleClientMessage(message);
        } catch (error) {
          this.log("error", "Error parsing WebSocket message:", error);
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        this.wsClient = undefined;
        this.cleanupHeartbeat();
      });

      // Handle errors
      ws.on("error", () => {
        this.wsClient = undefined;
        this.cleanupHeartbeat();
      });

      // Heartbeat to keep connection alive
      this.startHeartbeat(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          this.cleanupHeartbeat();
        }
      });
    });
  }

  private handleClientMessage(message: ClientMessage): void {
    // Handle different message types
    switch (message.type) {
      case "result":
        // Client sending command result
        if (message.id && message.result) {
          this.storeCommandResult(message.id, message.result);
        }
        break;

      case "pong":
        // Heartbeat response (no action needed)
        break;

      default:
        this.log("warn", `Unknown message type: ${JSON.stringify(message)}`);
    }
  }

  public override async stop(): Promise<void> {
    // Close WebSocket connection
    if (this.wsClient) {
      this.wsClient.close(1000, "Server shutting down");
      this.wsClient = undefined;
    }

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => {
          this.log("info", "WebSocket server stopped");
          resolve();
        });
      });
    }

    // Perform common shutdown tasks
    await this.performShutdown();
  }

  protected override isClientConnected(): boolean {
    return (
      this.wsClient !== undefined && this.wsClient.readyState === WebSocket.OPEN
    );
  }

  protected override sendRawData(data: string): void {
    this.wsClient!.send(data);
  }

  protected override handleConnectionDeath(): void {
    // Reject all pending commands on disconnect
    this.rejectAllPendingCommands("Client disconnected");
    this.cleanupHeartbeat();
    this.wsClient = undefined;
  }
}
