/**
 * Camera Tools End-to-End Tests
 *
 * Tests every camera MCP server tool through the full flow:
 *   Test → MCP transport → Camera MCP Server → WebSocket → Cesium viewer
 *
 * This file is transport-agnostic — it uses stdio by default, but can be
 * pointed at streamable-http via the MCP_TRANSPORT env var.  The focus here
 * is on *tool behaviour*, not transport mechanics.
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
  HttpStreamableMCPClient,
  TestWSViewerClient,
  createTestViewer,
} from "../helpers";
import { IMCPClient } from "../helpers/IMCPClient";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_PORT = 4003;
const SERVER_URL = `ws://localhost:${SERVER_PORT}/mcp/ws`;
const CAMERA_SERVER_DIR = path.resolve(
  __dirname,
  "../../../../../../servers/camera-server",
);

// Transport selection via environment variable (default: stdio)
const MCP_TRANSPORT = process.env.MCP_TRANSPORT || "stdio";

/** All tool names the camera server is expected to register. */
const ALL_CAMERA_TOOLS = [
  "camera_fly_to",
  "camera_set_view",
  "camera_get_position",
  "camera_look_at_transform",
  "camera_start_orbit",
  "camera_stop_orbit",
  "camera_set_controller_options",
] as const;

function createMCPClient(): IMCPClient {
  if (MCP_TRANSPORT === "streamable-http") {
    console.log(`[Test] Using streamable-http transport`);
    return new HttpStreamableMCPClient({
      serverDir: CAMERA_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "camera-e2e-test",
    });
  }

  console.log("[Test] Using stdio transport (spawning child process)");
  return new StdioMCPClient({
    serverDir: CAMERA_SERVER_DIR,
    port: SERVER_PORT,
    clientName: "camera-e2e-test",
  });
}

describe(`Camera Tools E2E [${MCP_TRANSPORT}]`, () => {
  let mcpClient: IMCPClient;
  let viewerClient: TestWSViewerClient;
  let viewer: CesiumViewer;

  beforeAll(async () => {
    mcpClient = createMCPClient();
    await mcpClient.start();
  }, 15000);

  afterAll(async () => {
    if (mcpClient) {
      await mcpClient.stop();
    }
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
    if (viewerClient) {
      await viewerClient.disconnect();
    }
  });

  // ─── Discovery ──────────────────────────────────────────────────────

  describe("Tool Discovery", () => {
    it("should list all camera tools from the MCP server", async () => {
      const result = await mcpClient.listTools();

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThanOrEqual(
        ALL_CAMERA_TOOLS.length,
      );

      const toolNames = result.tools.map((t) => t.name);
      for (const name of ALL_CAMERA_TOOLS) {
        expect(toolNames).toContain(name);
      }
    });

    it("should have client-side command handlers for all camera tools", () => {
      const cameraManager = viewerClient.getManager<CesiumCameraManager>();
      const handlers = cameraManager.getCommandHandlers();

      expect(handlers.size).toBeGreaterThanOrEqual(ALL_CAMERA_TOOLS.length);
      for (const name of ALL_CAMERA_TOOLS) {
        expect(handlers.has(name)).toBe(true);
      }
    });
  });

  // ─── camera_set_view ────────────────────────────────────────────────

  describe("camera_set_view", () => {
    it("should set camera position and orientation", async () => {
      const result = await mcpClient.callTool("camera_set_view", {
        destination: { longitude: 10.0, latitude: 20.0, height: 5000000 },
        orientation: { heading: 45, pitch: -30, roll: 0 },
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");

      const commands = viewerClient.getCommandsReceived();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands[0].type).toBe("camera_set_view");

      const DEG = Math.PI / 180;
      expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
        10.0 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
        20.0 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.height).toBe(5000000);
      expect(viewer.camera.heading).toBeCloseTo(45 * DEG, 10);
      expect(viewer.camera.pitch).toBeCloseTo(-30 * DEG, 10);
    });

    it("should apply default orientation when none is provided", async () => {
      const result = await mcpClient.callTool("camera_set_view", {
        destination: { longitude: 0, latitude: 0, height: 10000000 },
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const DEG = Math.PI / 180;
      expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
        0 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
        0 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.height).toBe(10000000);
    });
  });

  // ─── camera_fly_to ──────────────────────────────────────────────────

  describe("camera_fly_to", () => {
    it("should fly to a position and update viewer state", async () => {
      const result = await mcpClient.callTool("camera_fly_to", {
        destination: { longitude: -122.4194, latitude: 37.7749, height: 10000 },
        duration: 0.1,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "camera_fly_to")).toBe(
        true,
      );

      const DEG = Math.PI / 180;
      expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
        -122.4194 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
        37.7749 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.height).toBe(10000);
    });

    it("should accept advanced fly-to options", async () => {
      const result = await mcpClient.callTool("camera_fly_to", {
        destination: { longitude: 2.3522, latitude: 48.8566, height: 5000 },
        orientation: { heading: 90, pitch: -45, roll: 0 },
        duration: 0.1,
        maximumHeight: 20000000,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const DEG = Math.PI / 180;
      expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
        2.3522 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
        48.8566 * DEG,
        10,
      );
    });
  });

  // ─── camera_get_position ────────────────────────────────────────────

  describe("camera_get_position", () => {
    it("should return current camera position and orientation", async () => {
      // First set a known position
      await mcpClient.callTool("camera_set_view", {
        destination: { longitude: 15.0, latitude: 25.0, height: 3000000 },
        orientation: { heading: 10, pitch: -20, roll: 0 },
      });

      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("camera_get_position", {});

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.position).toBeDefined();
      expect(resultData.orientation).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "camera_get_position"),
      ).toBe(true);
    });
  });

  // ─── camera_look_at_transform ───────────────────────────────────────

  describe("camera_look_at_transform", () => {
    it("should lock camera to look at a target", async () => {
      const result = await mcpClient.callTool("camera_look_at_transform", {
        target: { longitude: -73.9857, latitude: 40.7484, height: 0 },
        offset: { heading: 0, pitch: -45, range: 5000 },
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "camera_look_at_transform"),
      ).toBe(true);
    });

    it("should use default offset when none is provided", async () => {
      const result = await mcpClient.callTool("camera_look_at_transform", {
        target: { longitude: 139.6917, latitude: 35.6895, height: 0 },
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
    });
  });

  // ─── camera_start_orbit / camera_stop_orbit ─────────────────────────

  describe("camera_start_orbit / camera_stop_orbit", () => {
    it("should start orbiting around the current target", async () => {
      const result = await mcpClient.callTool("camera_start_orbit", {
        speed: 0.05,
        direction: "counterclockwise",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "camera_start_orbit"),
      ).toBe(true);
    });

    it("should stop an active orbit", async () => {
      // Start first
      await mcpClient.callTool("camera_start_orbit", { speed: 0.05 });
      viewerClient.clearCommandHistory();

      // Then stop
      const result = await mcpClient.callTool("camera_stop_orbit", {});

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "camera_stop_orbit"),
      ).toBe(true);
    });

    it("should handle stop when no orbit is active", async () => {
      const result = await mcpClient.callTool("camera_stop_orbit", {});

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
    });

    it("should start orbiting in clockwise direction", async () => {
      const result = await mcpClient.callTool("camera_start_orbit", {
        speed: 0.03,
        direction: "clockwise",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      // Clean up
      await mcpClient.callTool("camera_stop_orbit", {});
    });
  });

  // ─── camera_set_controller_options ──────────────────────────────────

  describe("camera_set_controller_options", () => {
    it("should update camera controller settings", async () => {
      const result = await mcpClient.callTool("camera_set_controller_options", {
        enableCollisionDetection: false,
        minimumZoomDistance: 100,
        maximumZoomDistance: 20000000,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some(
          (c: MCPCommand) => c.type === "camera_set_controller_options",
        ),
      ).toBe(true);

      // Verify the mock viewer controller was updated
      const controller = viewer.scene.screenSpaceCameraController;
      expect(controller.enableCollisionDetection).toBe(false);
      expect(controller.minimumZoomDistance).toBe(100);
      expect(controller.maximumZoomDistance).toBe(20000000);
    });

    it("should toggle individual controller flags", async () => {
      const result = await mcpClient.callTool("camera_set_controller_options", {
        enableTilt: false,
        enableRotate: false,
        enableZoom: false,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const controller = viewer.scene.screenSpaceCameraController;
      expect(controller.enableTilt).toBe(false);
      expect(controller.enableRotate).toBe(false);
      expect(controller.enableZoom).toBe(false);
      // Untouched flags should remain at default
      expect(controller.enableTranslate).toBe(true);
      expect(controller.enableLook).toBe(true);
    });
  });

  // ─── Sequential / combined workflows ────────────────────────────────

  describe("Multi-tool Workflows", () => {
    it("should handle multiple sequential tool calls", async () => {
      await mcpClient.callTool("camera_set_view", {
        destination: { longitude: 0, latitude: 0, height: 10000000 },
      });

      await mcpClient.callTool("camera_set_view", {
        destination: { longitude: 10, latitude: 10, height: 5000000 },
      });

      const commands = viewerClient.getCommandsReceived();
      expect(commands.length).toBe(2);
      expect(commands[0].type).toBe("camera_set_view");
      expect(commands[1].type).toBe("camera_set_view");

      const DEG = Math.PI / 180;
      expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
        10 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
        10 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.height).toBe(5000000);
    });

    it("should set view, get position, then fly to new location", async () => {
      // Set an initial view
      await mcpClient.callTool("camera_set_view", {
        destination: { longitude: 12.4964, latitude: 41.9028, height: 1000000 },
      });

      // Read back the position
      const posResult = await mcpClient.callTool("camera_get_position", {});
      const posData = posResult.structuredContent;
      expect(posData.success).toBe(true);

      // Fly somewhere else
      const flyResult = await mcpClient.callTool("camera_fly_to", {
        destination: { longitude: 23.7275, latitude: 37.9838, height: 500000 },
        duration: 0.1,
      });
      const flyData = flyResult.structuredContent;
      expect(flyData.success).toBe(true);

      const DEG = Math.PI / 180;
      expect(viewer.camera.positionCartographic.longitude).toBeCloseTo(
        23.7275 * DEG,
        10,
      );
      expect(viewer.camera.positionCartographic.latitude).toBeCloseTo(
        37.9838 * DEG,
        10,
      );
    });

    it("should look at a target then start orbit around it", async () => {
      await mcpClient.callTool("camera_look_at_transform", {
        target: { longitude: -73.9857, latitude: 40.7484, height: 0 },
        offset: { heading: 0, pitch: -30, range: 10000 },
      });

      const orbitResult = await mcpClient.callTool("camera_start_orbit", {
        speed: 0.04,
      });
      const orbitData = orbitResult.structuredContent;
      expect(orbitData.success).toBe(true);

      // Clean up
      await mcpClient.callTool("camera_stop_orbit", {});
    });
  });
});
