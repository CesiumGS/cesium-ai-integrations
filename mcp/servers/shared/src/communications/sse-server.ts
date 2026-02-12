import { Request, Response } from "express";
import { BaseCommunicationServer } from "./baseCommunicationServer.js";

export class CesiumSSEServer extends BaseCommunicationServer {
  private sseClient: Response | null = null;

  protected override getServerToStart() {
    return this.app;
  }

  protected override getProtocolName(): string {
    return "SSE HTTP";
  }

  protected override setupRoutes(): void {
    // Call parent to setup common routes
    super.setupRoutes();

    // HTTP POST endpoint for SSE clients to send command results
    this.app.post("/mcp/result", (req: Request, res: Response) => {
      const { id, result } = req.body;
      this.storeCommandResult(id, result);
      res.json({ success: true });
    });

    // SSE endpoint for real-time commands
    this.app.get("/mcp/events", (req: Request, res: Response) => {
      // Only allow one client connection
      if (this.sseClient) {
        res.status(409).json({
          error:
            "A client is already connected. Only one client is supported per MCP server instance.",
        });
        return;
      }

      // Set SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      // Send initial connection event
      res.write(
        'data: {"type":"connected","message":"SSE connection established"}\n\n',
      );

      // Set the single client connection
      this.sseClient = res;
      console.error("SSE client connected");

      // Handle client disconnect
      req.on("close", () => {
        this.sseClient = null;
        console.error("SSE client disconnected");
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        if (res.writableEnded) {
          clearInterval(heartbeat);
          return;
        }
        res.write('data: {"type":"heartbeat"}\n\n');
      }, 30000); // 30 seconds

      req.on("close", () => {
        clearInterval(heartbeat);
      });
    });
  }

  public override async stop(): Promise<void> {
    // Reject all pending commands
    this.rejectAllPendingCommands("Server shutting down");

    // Close SSE connection
    if (this.sseClient) {
      this.sseClient.end();
      this.sseClient = null;
    }

    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.error("SSE HTTP server stopped");
          resolve();
        });
      });
    }
  }

  protected override isClientConnected(): boolean {
    return this.sseClient !== null;
  }

  protected override sendRawData(data: string): void {
    this.sseClient!.write(`data: ${data}\n\n`);
  }

  protected override handleConnectionDeath(): void {
    // Reject all pending commands on disconnect
    this.rejectAllPendingCommands("Client disconnected");
    this.sseClient = null;
  }
}
