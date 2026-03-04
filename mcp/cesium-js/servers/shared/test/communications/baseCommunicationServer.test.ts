import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import net from "net";
import { BaseCommunicationServer } from "../../src/communications/baseCommunicationServer";
import type { CommandResult } from "../../src/types/types";
import type { ServerConfig } from "../../src/models/serverConfig";

// ---------------------------------------------------------------------------
// Concrete TestServer that exposes protected methods for inspection
// ---------------------------------------------------------------------------
class TestServer extends BaseCommunicationServer {
  /** Raw command payloads sent via sendRawData — lets tests extract command IDs */
  public readonly sentData: string[] = [];
  private _clientConnected = false;

  public setClientConnected(v: boolean): void {
    this._clientConnected = v;
  }

  // --- abstract implementations ---
  protected override getProtocolName(): string {
    return "Test";
  }

  protected override isClientConnected(): boolean {
    return this._clientConnected;
  }

  protected override sendRawData(data: string): void {
    this.sentData.push(data);
  }

  protected override handleConnectionDeath(): void {
    this.rejectAllPendingCommands("Client disconnected");
  }

  public async stop(): Promise<void> {
    await this.performShutdown();
  }

  // --- expose protected helpers for testing ---
  public exposeStoreResult(id: string, result: CommandResult): void {
    this.storeCommandResult(id, result);
  }

  public exposeRejectAll(reason: string): void {
    this.rejectAllPendingCommands(reason);
  }

  /** Parse the last sent command payload and return its id */
  public lastSentCommandId(): string {
    const last = this.sentData[this.sentData.length - 1];
    return (JSON.parse(last) as { command: { id: string } }).command.id;
  }
}

const BASE_CONFIG: ServerConfig = { port: 0, maxRetries: 0 };

// ---------------------------------------------------------------------------
describe("BaseCommunicationServer", () => {
  let server: TestServer;

  beforeEach(() => {
    server = new TestServer();
  });

  afterEach(async () => {
    await server.stop().catch(() => {});
  });

  // -------------------------------------------------------------------------
  describe("getStats() — before start", () => {
    it("port is 0", () => expect(server.getStats().port).toBe(0));
    it("clients is 0", () => expect(server.getStats().clients).toBe(0));
    it("uptime is 0", () => expect(server.getStats().uptime).toBe(0));
    it("commandsExecuted is 0", () =>
      expect(server.getStats().commandsExecuted).toBe(0));
  });

  describe("getStats() — after start", () => {
    it("port matches the bound port", async () => {
      const port = await server.start(BASE_CONFIG);
      expect(server.getStats().port).toBe(port);
    });

    it("uptime is positive after start", async () => {
      await server.start(BASE_CONFIG);
      expect(server.getStats().uptime).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("executeCommand()", () => {
    it('throws "No client connected" when isClientConnected is false', async () => {
      server.setClientConnected(false);
      await expect(server.executeCommand({ type: "test" })).rejects.toThrow(
        "No client connected",
      );
    });

    it("rejects with timeout error after timeoutMs elapses", async () => {
      vi.useFakeTimers();
      server.setClientConnected(true);

      const promise = server.executeCommand({ type: "test" }, 5000);
      vi.advanceTimersByTime(5001);

      await expect(promise).rejects.toThrow("Command timeout");
      vi.useRealTimers();
    });

    it("sends the command payload via sendRawData", async () => {
      server.setClientConnected(true);
      // intentionally don't await — we resolve it manually below
      const promise = server.executeCommand({ type: "ping" }, 10000);
      const id = server.lastSentCommandId();
      server.exposeStoreResult(id, { success: true });
      await promise;
      expect(server.sentData).toHaveLength(1);
      expect(JSON.parse(server.sentData[0])).toMatchObject({
        type: "command",
        command: expect.objectContaining({ type: "ping" }),
      });
    });

    it("increments commandsExecuted on successful send", async () => {
      server.setClientConnected(true);
      const promise = server.executeCommand({ type: "test" }, 10000);
      server.exposeStoreResult(server.lastSentCommandId(), {});
      await promise;
      expect(server.getStats().commandsExecuted).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("storeCommandResult()", () => {
    it("resolves the matching pending command promise", async () => {
      server.setClientConnected(true);
      const promise = server.executeCommand({ type: "test" }, 10000);
      const id = server.lastSentCommandId();

      server.exposeStoreResult(id, { success: true, value: 42 });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it("clears the pending command from the map (no double-resolve)", async () => {
      server.setClientConnected(true);
      const promise = server.executeCommand({ type: "test" }, 10000);
      const id = server.lastSentCommandId();

      server.exposeStoreResult(id, { success: true });
      await promise; // first resolve

      // Calling again with the same id should be a no-op (already cleared)
      expect(() =>
        server.exposeStoreResult(id, { success: false }),
      ).not.toThrow();
    });

    it("ignores unknown command IDs", () => {
      expect(() =>
        server.exposeStoreResult("nonexistent-id", { success: true }),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  describe("rejectAllPendingCommands()", () => {
    it("rejects every pending command with the provided reason", async () => {
      server.setClientConnected(true);

      const p1 = server.executeCommand({ type: "cmd1" }, 10000);
      const p2 = server.executeCommand({ type: "cmd2" }, 10000);

      server.exposeRejectAll("Server shutting down");

      await expect(p1).rejects.toThrow("Server shutting down");
      await expect(p2).rejects.toThrow("Server shutting down");
    });

    it("clears the pending map (subsequent calls are no-ops)", async () => {
      server.setClientConnected(true);
      const p = server.executeCommand({ type: "test" }, 10000);
      server.exposeRejectAll("reason");
      await p.catch(() => {});

      // Second call should not throw
      expect(() => server.exposeRejectAll("reason2")).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  describe("start() — port binding and retry logic", () => {
    it("resolves with the actual bound port", async () => {
      const port = await server.start(BASE_CONFIG);
      expect(port).toBeGreaterThan(0);
    });

    it("retries the next port on EADDRINUSE", async () => {
      // Occupy a port first
      const occupied = net.createServer();
      await new Promise<void>((r) => occupied.listen(0, r));
      const occupiedPort = (occupied.address() as net.AddressInfo).port;

      try {
        const actualPort = await server.start({
          port: occupiedPort,
          maxRetries: 10,
          strictPort: false,
        });
        expect(actualPort).toBeGreaterThan(occupiedPort);
      } finally {
        await server.stop().catch(() => {});
        await new Promise<void>((r) => occupied.close(() => r()));
      }
    });

    it("rejects immediately with strictPort when port is in use", async () => {
      const occupied = net.createServer();
      await new Promise<void>((r) => occupied.listen(0, r));
      const occupiedPort = (occupied.address() as net.AddressInfo).port;

      try {
        await expect(
          server.start({
            port: occupiedPort,
            maxRetries: 10,
            strictPort: true,
          }),
        ).rejects.toThrow(
          `Port ${occupiedPort} is in use and strictPort mode is enabled`,
        );
      } finally {
        await new Promise<void>((r) => occupied.close(() => r()));
      }
    });

    it("rejects when retries are exhausted", async () => {
      const occupied = net.createServer();
      await new Promise<void>((r) => occupied.listen(0, r));
      const occupiedPort = (occupied.address() as net.AddressInfo).port;

      try {
        await expect(
          server.start({
            port: occupiedPort,
            maxRetries: 0,
            strictPort: false,
          }),
        ).rejects.toThrow(
          `No available ports found after 0 retries starting from port ${occupiedPort}`,
        );
      } finally {
        await new Promise<void>((r) => occupied.close(() => r()));
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("GET /mcp/health", () => {
    it('returns { status: "healthy" } with correct shape', async () => {
      const port = await server.start(BASE_CONFIG);
      const resp = await fetch(`http://localhost:${port}/mcp/health`);
      const json = (await resp.json()) as Record<string, unknown>;

      expect(resp.status).toBe(200);
      expect(json.status).toBe("healthy");
      expect(typeof json.connected).toBe("boolean");
      expect(typeof json.timestamp).toBe("string");
      expect(json.port).toBe(port);
      expect(json.clients).toBe(0);
      expect(json.commandsExecuted).toBe(0);
    });

    it("reflects connected: true when a client is present", async () => {
      const port = await server.start(BASE_CONFIG);
      server.setClientConnected(true);

      const resp = await fetch(`http://localhost:${port}/mcp/health`);
      const json = (await resp.json()) as Record<string, unknown>;

      expect(json.connected).toBe(true);
      expect(json.clients).toBe(1);
    });
  });
});
