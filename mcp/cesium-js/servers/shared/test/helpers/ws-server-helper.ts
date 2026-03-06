import WebSocket from "ws";

/** Connect a WebSocket client and wait for the initial "connected" message. */
export function connectClient(
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
export function nextMessage(ws: WebSocket): Promise<unknown> {
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
export function waitForClose(
  ws: WebSocket,
): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    ws.once("close", (code, reason) =>
      resolve({ code, reason: reason.toString() }),
    );
  });
}

/** Close a WebSocket cleanly and wait for it to reach CLOSED state. */
export function closeClient(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.once("close", () => resolve());
    ws.close();
  });
}
