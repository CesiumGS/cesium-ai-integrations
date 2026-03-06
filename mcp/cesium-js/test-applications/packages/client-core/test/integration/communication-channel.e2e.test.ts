/**
 * Communication Channel End-to-End Tests
 *
 * Tests the viewer ↔ server communication channel — how the MCP server
 * pushes commands to the Cesium viewer and how results flow back.
 *
 * Two protocols are supported:
 *   - WebSocket  (bidirectional, low-latency)
 *   - SSE        (server→viewer via EventSource, viewer→server via HTTP POST)
 *
 * These tests verify:
 *   - Connection establishment and lifecycle for each channel
 *   - Command delivery and result round-trip
 *   - Disconnect / reconnect behaviour
 *   - Heartbeat / keep-alive handling
 *
 * Note: the MCP transport (stdio) is fixed here. We vary only the
 * viewer↔server channel (COMMUNICATION_PROTOCOL env var on the server).
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
import type { MCPCommand } from "../../src/types/mcp";
import {
  StdioMCPClient,
  TestWSViewerClient,
  TestSSEViewerClient,
  createTestViewer,
} from "../helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMERA_SERVER_DIR = path.resolve(
  __dirname,
  "../../../../../servers/camera-server",
);

// ═══════════════════════════════════════════════════════════════════════════
//  WebSocket communication channel
// ═══════════════════════════════════════════════════════════════════════════

describe("Communication Channel — WebSocket", () => {
  const SERVER_PORT = 4020;
  const SERVER_URL = `ws://localhost:${SERVER_PORT}/mcp/ws`;
  let mcpClient: StdioMCPClient;
  let viewerClient: TestWSViewerClient;
  let viewer: CesiumViewer;

  beforeAll(async () => {
    mcpClient = new StdioMCPClient({
      serverDir: CAMERA_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "channel-ws-test",
      env: { COMMUNICATION_PROTOCOL: "websocket" },
    });
    await mcpClient.start();
  }, 15000);

  afterAll(async () => {
    await mcpClient.stop();
  }, 10000);

  beforeEach(async () => {
    viewer = createTestViewer();
    (viewer.scene as { camera: unknown }).camera = viewer.camera;

    const cameraManager = new CesiumCameraManager(viewer);
    viewerClient = new TestWSViewerClient(cameraManager, SERVER_URL);

    await viewerClient.waitForConnection();
    await viewerClient.setUp();
    viewerClient.clearCommandHistory();
  });

  afterEach(async () => {
    await viewerClient?.disconnect();
  });

  it("should establish a WebSocket connection to the server", () => {
    expect(viewerClient.isConnected()).toBe(true);
  });

  it("should receive commands and send results over WebSocket", async () => {
    const result = await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 5, latitude: 10, height: 2000000 },
    });

    expect(result.content).toBeDefined();
    const data = result.structuredContent;
    expect(data.success).toBe(true);

    const commands = viewerClient.getCommandsReceived();
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0].type).toBe("camera_set_view");
  });

  it("should maintain connection across multiple commands", async () => {
    for (let i = 0; i < 3; i++) {
      await mcpClient.callTool("camera_set_view", {
        destination: { longitude: i * 10, latitude: i * 5, height: 1000000 },
      });
    }

    expect(viewerClient.isConnected()).toBe(true);
    expect(viewerClient.getCommandsReceived().length).toBe(3);
  });

  it("should survive a brief idle period (heartbeat keep-alive)", async () => {
    expect(viewerClient.isConnected()).toBe(true);

    // Wait long enough for at least one heartbeat cycle
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(viewerClient.isConnected()).toBe(true);

    // Verify the connection is still usable
    const result = await mcpClient.callTool("camera_get_position", {});
    expect(result.content).toBeDefined();
    const data = result.structuredContent;
    expect(data.success).toBe(true);
  });

  it("should cleanly disconnect the viewer client", () => {
    viewerClient.disconnect();
    expect(viewerClient.isConnected()).toBe(false);
  });

  it("should allow a new viewer to connect after the previous one disconnects", async () => {
    await viewerClient.disconnect();
    expect(viewerClient.isConnected()).toBe(false);

    // Create a fresh viewer and connect
    const newViewer = createTestViewer();
    (newViewer.scene as { camera: unknown }).camera = newViewer.camera;
    const newManager = new CesiumCameraManager(newViewer);
    const newClient = new TestWSViewerClient(newManager, SERVER_URL);

    await newClient.waitForConnection();
    await newClient.setUp();
    expect(newClient.isConnected()).toBe(true);

    // Verify the new connection works
    const result = await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 30, latitude: 40, height: 3000000 },
    });
    expect(result.content).toBeDefined();

    const commands = newClient.getCommandsReceived();
    expect(commands.some((c: MCPCommand) => c.type === "camera_set_view")).toBe(
      true,
    );

    await newClient.disconnect();
  });

  it("should update viewer state through the WebSocket channel", async () => {
    await mcpClient.callTool("camera_set_view", {
      destination: { longitude: -74.006, latitude: 40.7128, height: 50000 },
      orientation: { heading: 90, pitch: -45, roll: 0 },
    });

    const DEG = Math.PI / 180;
    expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
      -74.006 * DEG,
      10,
    );
    expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
      40.7128 * DEG,
      10,
    );
    expect(viewer.camera.heading).toBeCloseTo(90 * DEG, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  SSE communication channel
// ═══════════════════════════════════════════════════════════════════════════

describe("Communication Channel — SSE", () => {
  const SERVER_PORT = 4021;
  const BASE_URL = `http://localhost:${SERVER_PORT}`;
  const SSE_EVENTS_URL = `${BASE_URL}/mcp/events`;
  const HEALTH_URL = `${BASE_URL}/mcp/health`;

  let mcpClient: StdioMCPClient;
  let viewerClient: TestSSEViewerClient;
  let viewer: CesiumViewer;

  beforeAll(async () => {
    mcpClient = new StdioMCPClient({
      serverDir: CAMERA_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "channel-sse-test",
      env: { COMMUNICATION_PROTOCOL: "sse" },
    });
    await mcpClient.start();
  }, 15000);

  afterAll(async () => {
    await mcpClient.stop();
  }, 10000);

  beforeEach(async () => {
    viewer = createTestViewer();
    (viewer.scene as { camera: unknown }).camera = viewer.camera;

    const cameraManager = new CesiumCameraManager(viewer);
    viewerClient = new TestSSEViewerClient(cameraManager, BASE_URL);

    await viewerClient.waitForConnection();
    await viewerClient.setUp();
    viewerClient.clearCommandHistory();
  });

  afterEach(async () => {
    await viewerClient?.disconnect();
  });

  it("should establish an SSE connection to the server", () => {
    expect(viewerClient.isConnected()).toBe(true);
  });

  it("should receive commands and send results over SSE", async () => {
    const result = await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 5, latitude: 10, height: 2000000 },
    });

    expect(result.content).toBeDefined();
    const data = result.structuredContent;
    expect(data.success).toBe(true);

    const commands = viewerClient.getCommandsReceived();
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0].type).toBe("camera_set_view");
  });

  it("should maintain connection across multiple commands", async () => {
    for (let i = 0; i < 3; i++) {
      await mcpClient.callTool("camera_set_view", {
        destination: { longitude: i * 10, latitude: i * 5, height: 1000000 },
      });
    }

    expect(viewerClient.isConnected()).toBe(true);
    expect(viewerClient.getCommandsReceived().length).toBe(3);
  });

  it("should survive a brief idle period (heartbeat keep-alive)", async () => {
    expect(viewerClient.isConnected()).toBe(true);

    // Wait long enough for at least one heartbeat cycle
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(viewerClient.isConnected()).toBe(true);

    // Verify the connection is still usable
    const result = await mcpClient.callTool("camera_get_position", {});
    expect(result.content).toBeDefined();
    const data = result.structuredContent;
    expect(data.success).toBe(true);
  });

  it("should cleanly disconnect the viewer client", () => {
    viewerClient.disconnect();
    expect(viewerClient.isConnected()).toBe(false);
  });

  it("should allow a new viewer to connect after the previous one disconnects", async () => {
    await viewerClient.disconnect();
    expect(viewerClient.isConnected()).toBe(false);

    // Create a fresh viewer and connect
    const newViewer = createTestViewer();
    (newViewer.scene as { camera: unknown }).camera = newViewer.camera;
    const newManager = new CesiumCameraManager(newViewer);
    const newClient = new TestSSEViewerClient(newManager, BASE_URL);

    await newClient.waitForConnection();
    await newClient.setUp();
    expect(newClient.isConnected()).toBe(true);

    // Verify the new connection works
    const result = await mcpClient.callTool("camera_set_view", {
      destination: { longitude: 30, latitude: 40, height: 3000000 },
    });
    expect(result.content).toBeDefined();

    const commands = newClient.getCommandsReceived();
    expect(commands.some((c: MCPCommand) => c.type === "camera_set_view")).toBe(
      true,
    );

    await newClient.disconnect();
  });

  it("should reject a second simultaneous SSE connection", async () => {
    // viewerClient is already connected — a second fetch should be rejected
    const response = await fetch(SSE_EVENTS_URL, {
      headers: { Accept: "text/event-stream" },
    });
    expect(response.status).toBe(409);
  });

  it("should update viewer state through the SSE channel", async () => {
    await mcpClient.callTool("camera_set_view", {
      destination: { longitude: -74.006, latitude: 40.7128, height: 50000 },
      orientation: { heading: 90, pitch: -45, roll: 0 },
    });

    const DEG = Math.PI / 180;
    expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
      -74.006 * DEG,
      10,
    );
    expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
      40.7128 * DEG,
      10,
    );
    expect(viewer.camera.heading).toBeCloseTo(90 * DEG, 10);
  });

  it("should expose the health endpoint", async () => {
    const response = await fetch(HEALTH_URL);
    expect(response.ok).toBe(true);

    const health = (await response.json()) as { status: string; port: number };
    expect(health.status).toBe("healthy");
    expect(health.port).toBe(SERVER_PORT);
  });
});
