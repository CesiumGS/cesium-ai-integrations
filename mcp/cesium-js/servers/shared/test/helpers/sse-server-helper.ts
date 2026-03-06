import http from "http";

/**
 * Open a raw SSE connection and return the IncomingMessage stream plus a cleanup
 * function that destroys the underlying socket.
 */
export function openSSEConnection(
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
export function nextChunk(res: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    res.once("data", (chunk: Buffer) => resolve(chunk.toString()));
    res.once("error", reject);
  });
}

/**
 * Wait until an IncomingMessage stream ends (server closed the connection).
 */
export function waitForEnd(res: http.IncomingMessage): Promise<void> {
  return new Promise((resolve) => res.once("end", resolve));
}

/** POST a command result to the server's result endpoint */
export async function postResult(
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
