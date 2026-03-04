import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "http";
import { CesiumSSEServer } from "../../src/communications/sse-server";
import type { ServerConfig } from "../../src/models/serverConfig";

const BASE_CONFIG: ServerConfig = { port: 0, maxRetries: 0, logLevel: "error" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Open a raw SSE connection and return the IncomingMessage stream plus a cleanup
 * function that destroys the underlying socket.
 */
function openSSEConnection(
  port: number,
): Promise<{ res: http.IncomingMessage; close: () => void }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { host: "localhost", port, path: "/mcp/events" },
      (res) => resolve({ res, close: () => req.destroy() }),
    );
    req.on("error", (e) => {
      // AbortError from req.destroy() is expected during cleanup
      if ((e as NodeJS.ErrnoException).code !== "ECONNRESET") {
        reject(e);
      }
    });
  });
}

/**
 * Read the next data chunk from an SSE stream.
 */
function nextChunk(res: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    res.once("data", (chunk: Buffer) => resolve(chunk.toString()));
    res.once("error", reject);
  });
}

/**
 * Wait until an IncomingMessage stream ends (server closed the connection).
 */
function waitForEnd(res: http.IncomingMessage): Promise<void> {
  return new Promise((resolve) => res.once("end", resolve));
}

/** POST a command result to the server's result endpoint */
async function postResult(
  port: number,
  id: string,
  result: unknown,
): Promise<void> {
  const body = JSON.stringify({ id, result });
  await new Promise<void>((resolve, reject) => {
    const req = http.request(
      {
        host: "localhost",
        port,
        path: "/mcp/result",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume(); // drain
        res.on("end", resolve);
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
describe("CesiumSSEServer", () => {
  let server: CesiumSSEServer;
  let port: number;

  beforeEach(async () => {
    server = new CesiumSSEServer();
    port = await server.start(BASE_CONFIG);
  });

  afterEach(async () => {
    await server.stop().catch(() => {});
  });

  // -------------------------------------------------------------------------
  describe("GET /mcp/events", () => {
    it("responds with HTTP 200", async () => {
      const { res, close } = await openSSEConnection(port);
      expect(res.statusCode).toBe(200);
      close();
    });

    it("sets Content-Type: text/event-stream", async () => {
      const { res, close } = await openSSEConnection(port);
      expect(res.headers["content-type"]).toBe("text/event-stream");
      close();
    });

    it('sends a "connected" event as the first data chunk', async () => {
      const { res, close } = await openSSEConnection(port);
      const chunk = await nextChunk(res);
      expect(chunk).toContain('"type":"connected"');
      close();
    });

    it("returns 409 when a client is already connected", async () => {
      const { close: close1 } = await openSSEConnection(port);

      // Second connection should be rejected
      const resp = await fetch(`http://localhost:${port}/mcp/events`);
      expect(resp.status).toBe(409);
      await resp.body?.cancel();

      close1();
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /mcp/result", () => {
    it("resolves a pending executeCommand when the matching id is posted", async () => {
      // 1. Connect SSE client so executeCommand can send
      const { res: sseRes, close } = await openSSEConnection(port);
      await nextChunk(sseRes); // consume the "connected" event

      // 2. Fire executeCommand (it sends a command via SSE, don't await yet)
      const commandPromise = server.executeCommand({ type: "test" }, 5000);

      // 3. Read the incoming command from the SSE stream
      const commandChunk = await nextChunk(sseRes);
      const parsed = JSON.parse(commandChunk.replace(/^data: /, "").trim()) as {
        command: { id: string };
      };
      const commandId = parsed.command.id;

      // 4. POST the result back
      await postResult(port, commandId, { success: true, value: "done" });

      // 5. executeCommand should resolve
      const result = await commandPromise;
      expect(result.success).toBe(true);
      expect(result.value).toBe("done");

      close();
    });
  });

  // -------------------------------------------------------------------------
  describe("client disconnect", () => {
    it("allows a new client to connect after the previous one disconnects", async () => {
      const { res: _, close } = await openSSEConnection(port);

      // Verify connected
      const resp1 = await fetch(`http://localhost:${port}/mcp/events`);
      expect(resp1.status).toBe(409);
      await resp1.body?.cancel();

      // Disconnect
      close();
      // Give the server time to process the close event
      await new Promise((r) => setTimeout(r, 50));

      // New client should now be accepted
      const { res: res2, close: close2 } = await openSSEConnection(port);
      expect(res2.statusCode).toBe(200);
      close2();
    });

    it("cleans up: getStats shows 0 clients after disconnect", async () => {
      const { close } = await openSSEConnection(port);
      expect(server.getStats().clients).toBe(1);

      close();
      await new Promise((r) => setTimeout(r, 50));

      expect(server.getStats().clients).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("stop()", () => {
    it("ends the SSE response stream so the client receives end-of-stream", async () => {
      const { res } = await openSSEConnection(port);
      await nextChunk(res); // consume connected event

      const endPromise = waitForEnd(res);
      await server.stop();

      await expect(endPromise).resolves.toBeUndefined();
    });

    it("causes getStats to return 0 clients after stop", async () => {
      const { close } = await openSSEConnection(port);
      expect(server.getStats().clients).toBe(1);

      await server.stop();
      close();

      expect(server.getStats().clients).toBe(0);
    });
  });
});
