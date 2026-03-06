/**
 * Common interface for test viewer clients.
 *
 * Implemented by both TestViewerClient (WebSocket) and TestSSEViewerClient (SSE)
 * so test code can be written against the interface and work with either transport.
 */

import type { MCPCommand, ManagerInterface } from "../../src/types/mcp";

export interface ITestViewerClient {
  /** Resolves once the viewer successfully connects to the server. */
  waitForConnection(): Promise<void>;

  /** Runs manager.setUp() — registers command handlers. */
  setUp(): Promise<void>;

  /** Returns a snapshot of every command received since the last clearCommandHistory(). */
  getCommandsReceived(): MCPCommand[];

  /** Clears the recorded command history. */
  clearCommandHistory(): void;

  /** Returns true when the transport is open and ready. */
  isConnected(): boolean;

  /** Closes the transport and calls manager.shutdown(). */
  disconnect(): Promise<void>;

  /** Returns the underlying manager cast to T. */
  getManager<T extends ManagerInterface>(): T;
}
