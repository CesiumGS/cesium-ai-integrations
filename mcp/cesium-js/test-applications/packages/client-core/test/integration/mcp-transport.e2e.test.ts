/**
 * MCP Transport End-to-End Tests
 *
 * Tests the MCP transport layer specifically — how the LLM / test client talks
 * to the MCP server. Covers:
 *   - stdio (JSON-RPC over stdin/stdout)
 *   - streamable-http (JSON-RPC over HTTP POST, with optional SSE responses)
 *
 * These tests verify connection lifecycle, protocol handshake, error handling,
 * and transport-specific edge cases. Tool-level behaviour lives in
 * camera-tools.e2e.test.ts; this file is about the *transport pipe*.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CesiumCameraManager from "../../src/managers/camera-manager";
import type { CesiumViewer } from "../../src/types/cesium-types";
import {
  StdioMCPClient,
  HttpStreamableMCPClient,
  TestWSViewerClient,
  createTestViewer,
} from "../helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMERA_SERVER_DIR = path.resolve(
  __dirname,
  "../../../../../../servers/camera-server",
);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Common setup for a fresh viewer + WS-connected TestWSViewerClient. */
async function connectViewer(port: number): Promise<{
  viewer: CesiumViewer;
  viewerClient: TestWSViewerClient;
}> {
  const viewer = createTestViewer();
  (viewer.scene as { camera: unknown }).camera = viewer.camera;

  const cameraManager = new CesiumCameraManager(viewer);
  const viewerClient = new TestWSViewerClient(
    cameraManager,
    `ws://localhost:${port}/mcp/ws`,
  );
  await viewerClient.waitForConnection();
  await viewerClient.setUp();
  viewerClient.clearCommandHistory();

  return { viewer, viewerClient };
}

// ═══════════════════════════════════════════════════════════════════════════
//  stdio transport
// ═══════════════════════════════════════════════════════════════════════════

describe("MCP Transport — stdio", () => {
  const SERVER_PORT = 4010;
  let mcpClient: StdioMCPClient;
  let viewerClient: TestWSViewerClient;
  let _viewer: CesiumViewer;

  beforeAll(async () => {
    mcpClient = new StdioMCPClient({
      serverDir: CAMERA_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "transport-stdio-test",
    });
    await mcpClient.start();
  }, 15000);

  afterAll(async () => {
    await mcpClient.stop();
  }, 10000);

  beforeEach(async () => {
    ({ viewer: _viewer, viewerClient } = await connectViewer(SERVER_PORT));
  });

  afterEach(async () => {
    await viewerClient?.disconnect();
  });

  it("should complete MCP initialize handshake via stdio", async () => {
    // If we got here, start() succeeded → handshake worked.
    // Verify via listing tools (requires a working session).
    const result = await mcpClient.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
  });

  it("should call a tool and receive a response over stdio", async () => {
    const result = await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 5, latitude: 5, height: 1000000 },
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");

    const data = result.structuredContent;
    expect(data.success).toBe(true);
  });

  it("should handle rapid sequential requests over stdio", async () => {
    const calls = Array.from({ length: 5 }, (_, i) =>
      mcpClient.callTool("camera_set_view", {
        destination: {
          longitude: i,
          latitude: i,
          height: 1000000 + i * 100000,
        },
      }),
    );

    // Run sequentially to avoid ordering issues with stdio buffer
    for (const call of calls) {
      const result = await call;
      expect(result.content).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  streamable-http transport
// ═══════════════════════════════════════════════════════════════════════════

describe("MCP Transport — streamable-http", () => {
  const SERVER_PORT = 4011;

  let mcpClient: HttpStreamableMCPClient;
  let viewerClient: TestWSViewerClient;
  let _viewer: CesiumViewer;

  beforeAll(async () => {
    mcpClient = new HttpStreamableMCPClient({
      serverDir: CAMERA_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "transport-http-test",
    });
    await mcpClient.start();
  }, 15000);

  afterAll(async () => {
    await mcpClient.stop();
  }, 10000);

  beforeEach(async () => {
    ({ viewer: _viewer, viewerClient } = await connectViewer(SERVER_PORT));
  });

  afterEach(async () => {
    await viewerClient?.disconnect();
  });

  it("should complete MCP initialize handshake via HTTP", async () => {
    const result = await mcpClient.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
  });

  it("should call a tool and receive a response over HTTP", async () => {
    const result = await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 20, latitude: 30, height: 2000000 },
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");

    const data = result.structuredContent;
    expect(data.success).toBe(true);
  });

  it("should maintain session across multiple HTTP requests", async () => {
    // First request establishes the session
    await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 1, latitude: 1, height: 1000000 },
    });

    // Second request must reuse the same session
    const result = await mcpClient.callTool("camera_get_position", {});
    expect(result.content).toBeDefined();
    const data = result.structuredContent;
    expect(data.success).toBe(true);
  });

  it("should handle concurrent HTTP requests", async () => {
    // Fire multiple requests in parallel — HTTP naturally supports this
    const results = await Promise.all([
      mcpClient.callTool("camera_set_view", {
        destination: { longitude: 10, latitude: 10, height: 1000000 },
      }),
      mcpClient.callTool("camera_get_position", {}),
    ]);

    for (const result of results) {
      expect(result.content).toBeDefined();
    }
  });
});
