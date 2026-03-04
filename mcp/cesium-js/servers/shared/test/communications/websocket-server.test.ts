import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WebSocket from "ws";
import { CesiumWebSocketServer } from "../../src/communications/websocket-server";
import type { ServerConfig } from "../../src/models/serverConfig";

const BASE_CONFIG: ServerConfig = { port: 0, maxRetries: 0, logLevel: "error" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Connect a WebSocket client and wait for the initial "connected" message. */
function connectClient(
  port: number,
): Promise<{ ws: WebSocket; firstMessage: unknown }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/mcp/ws`);
    ws.once("message", (data) => {
      try {
        resolve({ ws, firstMessage: JSON.parse(data.toString()) });
      } catch (e) {
        reject(e);
      }
    });
    ws.once("error", reject);
  });
}

/** Wait for the next message from an already-open WebSocket. */
function nextMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ws.once("message", (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (e) {
        reject(e);
      }
    });
    ws.once("error", reject);
  });
}

/** Wait for a WebSocket to close. */
function waitForClose(
  ws: WebSocket,
): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    ws.once("close", (code, reason) =>
      resolve({ code, reason: reason.toString() }),
    );
  });
}

/** Close a WebSocket cleanly and wait for it to reach CLOSED state. */
function closeClient(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.once("close", () => resolve());
    ws.close();
  });
}

// ---------------------------------------------------------------------------
describe("CesiumWebSocketServer", () => {
  let server: CesiumWebSocketServer;
  let port: number;

  beforeEach(async () => {
    server = new CesiumWebSocketServer();
    port = await server.start(BASE_CONFIG);
  });

  afterEach(async () => {
    await server.stop().catch(() => {});
  });

  // -------------------------------------------------------------------------
  describe("connection handshake", () => {
    it('sends { type: "connected" } as the first message', async () => {
      const { ws, firstMessage } = await connectClient(port);
      expect(firstMessage).toMatchObject({ type: "connected" });
      await closeClient(ws);
    });

    it("closes a second connection with code 1008", async () => {
      const { ws: ws1 } = await connectClient(port);

      // Second client — we expect it to be closed by the server
      const ws2 = new WebSocket(`ws://localhost:${port}/mcp/ws`);
      const { code } = await waitForClose(ws2);

      expect(code).toBe(1008);

      await closeClient(ws1);
    });
  });

  // -------------------------------------------------------------------------
  describe("message handling — result", () => {
    it("resolves a pending executeCommand when the matching result message arrives", async () => {
      const { ws } = await connectClient(port);

      // Start executeCommand (don't await — it pends until the result message arrives)
      const commandPromise = server.executeCommand({ type: "test_op" }, 5000);

      // The server sends a command via WebSocket; read it back from the client side
      const commandMsg = (await nextMessage(ws)) as { command: { id: string } };
      const commandId = commandMsg.command.id;

      // Send the result back as the client would
      ws.send(
        JSON.stringify({
          type: "result",
          id: commandId,
          result: { success: true, data: 99 },
        }),
      );

      const result = await commandPromise;
      expect(result.success).toBe(true);
      expect(result.data).toBe(99);

      await closeClient(ws);
    });
  });

  // -------------------------------------------------------------------------
  describe("message handling — pong", () => {
    it('silently ignores { type: "pong" } without throwing or crashing', async () => {
      const { ws } = await connectClient(port);

      // Send pong — no assertion possible other than "server stays alive"
      ws.send(JSON.stringify({ type: "pong" }));

      // Give event loop a tick
      await new Promise((r) => setTimeout(r, 20));

      // Server should still accept commands
      expect(server.getStats().clients).toBe(1);

      await closeClient(ws);
    });
  });

  // -------------------------------------------------------------------------
  describe("message handling — malformed JSON", () => {
    it("does not crash the server when malformed JSON is received", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { ws } = await connectClient(port);

      ws.send("not { valid json }}}");

      await new Promise((r) => setTimeout(r, 30));

      // Server is still alive and still has the client connected
      expect(server.getStats().clients).toBe(1);

      consoleSpy.mockRestore();
      await closeClient(ws);
    });
  });

  // -------------------------------------------------------------------------
  describe("stop()", () => {
    it("closes the WebSocket connection to the client", async () => {
      const { ws } = await connectClient(port);
      const closePromise = waitForClose(ws);

      await server.stop();

      const { code } = await closePromise;
      expect(code).toBe(1000);
    });

    it("causes getStats to return 0 clients after stop", async () => {
      const { ws } = await connectClient(port);
      expect(server.getStats().clients).toBe(1);

      await server.stop();

      // Wait for the client to receive the close
      await waitForClose(ws);

      expect(server.getStats().clients).toBe(0);
    });

    it("resolves cleanly even when no client is connected", async () => {
      await expect(server.stop()).resolves.toBeUndefined();
    });
  });
});
