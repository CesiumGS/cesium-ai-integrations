import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import { BaseCommunicationServer } from './baseCommunicationServer.js';

export class CesiumWebSocketServer extends BaseCommunicationServer {
  private httpServer?: HttpServer;
  private wss?: WebSocketServer;
  private wsClient?: WebSocket;

  protected override getServerToStart(): any {
    // Create HTTP server
    this.httpServer = createServer(this.app);
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ 
      server: this.httpServer,
      path: '/mcp/ws'
    });

    // Setup WebSocket handlers
    this.setupWebSocket();

    return this.httpServer;
  }

  protected override getProtocolName(): string {
    return 'WebSocket';
  }

  private setupWebSocket(): void {
    if (!this.httpServer || !this.wss) return;

    this.wss.on('connection', (ws: WebSocket) => {
      // Only allow one client connection
      if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
        ws.close(1008, 'A client is already connected. Only one client is supported per MCP server instance.');
        console.error('WebSocket connection rejected: client already connected');
        return;
      }

      this.wsClient = ws;
      console.error('WebSocket client connected');

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established'
      }));

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.wsClient = undefined;
        clearInterval(heartbeatInterval);
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        this.wsClient = undefined;
      });

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds
    });
  }

  private handleClientMessage(message: any): void {
    // Handle different message types
    switch (message.type) {
      case 'result':
        // Client sending command result
        if (message.id && message.result) {
          this.storeCommandResult(message.id, message.result);
        }
        break;
      
      case 'pong':
        // Heartbeat response (no action needed)
        break;
      
      default:
        console.error(`⚠️ Unknown message type: ${message.type}`);
    }
  }

  public override async stop(): Promise<void> {
    // Reject all pending commands
    this.rejectAllPendingCommands('Server shutting down');

    // Close WebSocket connection
    if (this.wsClient) {
      this.wsClient.close(1000, 'Server shutting down');
      this.wsClient = undefined;
    }

    // Close WebSocket server
    if (this.wss) {
      return new Promise((resolve) => {
        this.wss!.close(() => {
          console.error('WebSocket server stopped');
          
          // Close HTTP server
          if (this.httpServer) {
            this.httpServer.close(() => {
              console.error('HTTP server stopped');
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    } else if (this.httpServer) {
      // Fallback: close HTTP server directly
      return new Promise((resolve) => {
        this.httpServer!.close(() => {
          console.error('HTTP server stopped');
          resolve();
        });
      });
    }
  }

  protected override isClientConnected(): boolean {
    return this.wsClient !== undefined && this.wsClient.readyState === WebSocket.OPEN;
  }

  protected override sendRawData(data: string): void {
    this.wsClient!.send(data);
  }

  protected override handleConnectionDeath(): void {
    // Reject all pending commands on disconnect
    this.rejectAllPendingCommands('Client disconnected');
    this.wsClient = undefined;
  }
}
