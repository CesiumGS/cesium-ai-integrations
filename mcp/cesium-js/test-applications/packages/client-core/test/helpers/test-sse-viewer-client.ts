/**
 * Reusable SSE viewer client that simulates a Cesium viewer connected to an
 * MCP server over the SSE channel.
 *
 * Server → viewer:  Server-Sent Events on  GET /mcp/events
 * Viewer → server:  HTTP POST              POST /mcp/result
 *
 * Uses fetch + ReadableStream instead of EventSource so that it works in the
 * Node.js test environment (vitest environment: 'node').
 *
 * Usage:
 *   const manager = new CesiumCameraManager(viewer);
 *   const client = new TestSSEViewerClient(manager, 'http://localhost:4021');
 *   await client.waitForConnection();
 *   await client.setUp();
 */

import type {
  MCPCommand,
  MCPCommandResult,
  ManagerInterface,
} from "../../src/types/mcp";
import type { ITestViewerClient } from "./ITestViewerClient";

export class TestSSEViewerClient implements ITestViewerClient {
  private commandsReceived: MCPCommand[] = [];
  private connected = false;
  private abortController: AbortController | null = null;
  private connectionReady: Promise<void>;
  private resolveConnection!: () => void;
  private rejectConnection!: (error: Error) => void;
  private readonly eventsUrl: string;
  private readonly resultUrl: string;
  /** Tracks the in-flight streamEvents() promise so disconnect() can await it. */
  private _streamSettled: Promise<void> = Promise.resolve();

  constructor(
    private manager: ManagerInterface,
    /** Base URL, e.g. 'http://localhost:4021' */
    baseUrl: string,
  ) {
    this.eventsUrl = `${baseUrl}/mcp/events`;
    this.resultUrl = `${baseUrl}/mcp/result`;

    this.connectionReady = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });

    this.connect();
  }

  // ── connection ────────────────────────────────────────────────────────────

  private connect(): void {
    this.abortController = new AbortController();
    this._streamSettled = this.streamEvents(this.abortController.signal).catch(
      (err) => {
        if (!this.connected) {
          this.rejectConnection(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      },
    );

    // Timeout if we never receive the "connected" event
    setTimeout(() => {
      if (!this.connected) {
        this.rejectConnection(new Error("SSE connection timeout"));
      }
    }, 5000);
  }

  private async streamEvents(signal: AbortSignal): Promise<void> {
    const response = await fetch(this.eventsUrl, {
      headers: { Accept: "text/event-stream" },
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `SSE connect failed: ${response.status} ${response.statusText}`,
      );
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split(/\n\n/);
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          await this.handleRawEvent(part);
        }
      }
    } finally {
      reader.releaseLock();
      this.connected = false;
    }
  }

  /** Parse one raw SSE block (may contain multiple "data:" lines). */
  private async handleRawEvent(raw: string): Promise<void> {
    const dataLines = raw
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim());

    if (dataLines.length === 0) {
      return;
    }

    const dataStr = dataLines.join("");
    let message: Record<string, string | MCPCommand>;
    try {
      message = JSON.parse(dataStr) as Record<string, string | MCPCommand>;
    } catch {
      return;
    }

    switch (message.type) {
      case "connected":
        this.connected = true;
        this.resolveConnection();
        break;

      case "command":
        if (message.command) {
          const command = message.command as MCPCommand;
          this.commandsReceived.push(command);
          await this.handleCommand(command);
        }
        break;

      case "heartbeat":
        // no-op — keep-alive from server
        break;

      default:
        break;
    }
  }

  // ── command dispatch ──────────────────────────────────────────────────────

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

    if (command.id) {
      await this.sendResult(command.id, result);
    }
  }

  private async sendResult(
    id: string,
    result: MCPCommandResult,
  ): Promise<void> {
    try {
      await fetch(this.resultUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, result }),
      });
    } catch {
      // Silently ignore — server may be shutting down
    }
  }

  // ── public API ────────────────────────────────────────────────────────────

  async waitForConnection(): Promise<void> {
    return this.connectionReady;
  }

  async setUp(): Promise<void> {
    await this.manager.setUp();
  }

  getCommandsReceived(): MCPCommand[] {
    return [...this.commandsReceived];
  }

  clearCommandHistory(): void {
    this.commandsReceived = [];
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): Promise<void> {
    this.connected = false;
    this.abortController?.abort();
    this.abortController = null;
    this.manager.shutdown();
    // Wait for the SSE stream to fully settle, then give the server a brief
    // window to fire req.on('close') before the next test tries to connect.
    // Without this delay the server-side sseClient may still be set when
    // beforeEach for the next test runs, producing a spurious 409 response.
    return this._streamSettled.then(
      () => new Promise<void>((resolve) => setTimeout(resolve, 100)),
    );
  }

  getManager<T extends ManagerInterface>(): T {
    return this.manager as T;
  }
}
