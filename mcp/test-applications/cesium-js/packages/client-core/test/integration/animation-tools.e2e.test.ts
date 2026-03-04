/**
 * Animation Tools End-to-End Tests
 *
 * Tests every animation MCP server tool through the full flow:
 *   Test → MCP transport → Animation MCP Server → WebSocket → Cesium viewer
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
import CesiumAnimationManager from "../../src/managers/animation-manager";
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
const SERVER_PORT = 4005;
const SERVER_URL = `ws://localhost:${SERVER_PORT}/mcp/ws`;
const ANIMATION_SERVER_DIR = path.resolve(
  __dirname,
  "../../../../../../servers/animation-server",
);

// Transport selection via environment variable (default: stdio)
const MCP_TRANSPORT = process.env.MCP_TRANSPORT || "stdio";

/** All tool names the animation server is expected to register. */
const ALL_ANIMATION_TOOLS = [
  "animation_create",
  "animation_control",
  "animation_remove",
  "animation_list_active",
  "animation_update_path",
  "animation_camera_tracking",
  "clock_control",
  "globe_set_lighting",
] as const;

/** Reusable minimal position samples for animation tests. */
const SAMPLE_ROUTE = [
  {
    time: "2024-01-01T00:00:00Z",
    longitude: -122.4194,
    latitude: 37.7749,
    height: 1000,
  },
  {
    time: "2024-01-01T00:01:00Z",
    longitude: -121.8853,
    latitude: 37.3382,
    height: 2000,
  },
  {
    time: "2024-01-01T00:02:00Z",
    longitude: -121.4944,
    latitude: 38.5816,
    height: 1500,
  },
];

function createMCPClient(): IMCPClient {
  if (MCP_TRANSPORT === "streamable-http") {
    console.log(`[Test] Using streamable-http transport`);
    return new HttpStreamableMCPClient({
      serverDir: ANIMATION_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "animation-e2e-test",
    });
  }

  console.log("[Test] Using stdio transport (spawning child process)");
  return new StdioMCPClient({
    serverDir: ANIMATION_SERVER_DIR,
    port: SERVER_PORT,
    clientName: "animation-e2e-test",
  });
}

describe(`Animation Tools E2E [${MCP_TRANSPORT}]`, () => {
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

    const animationManager = new CesiumAnimationManager(viewer);
    viewerClient = new TestWSViewerClient(animationManager, SERVER_URL);

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
    it("should list all animation tools from the MCP server", async () => {
      const result = await mcpClient.listTools();

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThanOrEqual(
        ALL_ANIMATION_TOOLS.length,
      );

      const toolNames = result.tools.map((t) => t.name);
      for (const name of ALL_ANIMATION_TOOLS) {
        expect(toolNames).toContain(name);
      }
    });

    it("should have client-side command handlers for all animation operations", () => {
      const animationManager =
        viewerClient.getManager<CesiumAnimationManager>();
      const handlers = animationManager.getCommandHandlers();

      const expectedHandlers = [
        "clock_control",
        "animation_create",
        "animation_control",
        "animation_remove",
        "animation_update_path",
        "animation_camera_tracking",
        "animation_list_active",
        "globe_lighting",
      ];
      for (const name of expectedHandlers) {
        expect(handlers.has(name)).toBe(true);
      }
    });
  });

  // ─── clock_control ──────────────────────────────────────────────────

  describe("clock_control", () => {
    it("should configure the clock with start/stop times and multiplier", async () => {
      const result = await mcpClient.callTool("clock_control", {
        action: "configure",
        clock: {
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          currentTime: "2024-01-01T00:00:00Z",
          clockRange: "LOOP_STOP",
          multiplier: 60,
          shouldAnimate: false,
        },
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "clock_control")).toBe(
        true,
      );
    });

    it("should set the current clock time", async () => {
      const result = await mcpClient.callTool("clock_control", {
        action: "setTime",
        currentTime: "2024-06-15T12:00:00Z",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "clock_control")).toBe(
        true,
      );
    });

    it("should set the clock multiplier", async () => {
      const result = await mcpClient.callTool("clock_control", {
        action: "setMultiplier",
        multiplier: 100,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "clock_control")).toBe(
        true,
      );
    });
  });

  // ─── globe_set_lighting ─────────────────────────────────────────────

  describe("globe_set_lighting", () => {
    it("should enable globe lighting", async () => {
      const result = await mcpClient.callTool("globe_set_lighting", {
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "globe_lighting"),
      ).toBe(true);

      // Verify viewer globe state was updated
      const globe = viewer.scene.globe as {
        enableLighting: boolean;
        dynamicAtmosphereLighting: boolean;
      };
      expect(globe.enableLighting).toBe(true);
      expect(globe.dynamicAtmosphereLighting).toBe(true);
    });

    it("should disable globe lighting", async () => {
      // First enable
      await mcpClient.callTool("globe_set_lighting", {
        enableLighting: true,
      });
      viewerClient.clearCommandHistory();

      // Then disable
      const result = await mcpClient.callTool("globe_set_lighting", {
        enableLighting: false,
      });

      expect(result.structuredContent.success).toBe(true);

      const globe = viewer.scene.globe as {
        enableLighting: boolean;
        dynamicAtmosphereLighting: boolean;
      };
      expect(globe.enableLighting).toBe(false);
      expect(globe.dynamicAtmosphereLighting).toBe(false);
    });
  });

  // ─── animation_create ───────────────────────────────────────────────

  describe("animation_create", () => {
    it("should create an animation from position samples", async () => {
      const result = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        name: "Test Flight",
        modelPreset: "cesium_man",
        speedMultiplier: 10,
        autoPlay: false,
        showPath: true,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.animationId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "animation_create"),
      ).toBe(true);

      // Entity should be added to the viewer
      expect(viewer.entities.values.length).toBeGreaterThan(0);
    });

    it("should create an animation with loop mode", async () => {
      const result = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        name: "Looping Route",
        loopMode: "loop",
        speedMultiplier: 5,
        autoPlay: false,
      });

      expect(result.structuredContent.success).toBe(true);
      expect(result.structuredContent.animationId).toBeDefined();
    });

    it("should create an animation with path visualization disabled", async () => {
      const result = await mcpClient.callTool("animation_create", {
        positionSamples: [
          {
            time: "2024-03-01T00:00:00Z",
            longitude: 2.3522,
            latitude: 48.8566,
            height: 500,
          },
          {
            time: "2024-03-01T00:05:00Z",
            longitude: 13.405,
            latitude: 52.52,
            height: 800,
          },
        ],
        showPath: false,
        autoPlay: false,
      });

      expect(result.structuredContent.success).toBe(true);
    });
  });

  // ─── animation_control ──────────────────────────────────────────────

  describe("animation_control", () => {
    it("should play an animation", async () => {
      // Create an animation first
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;

      viewerClient.clearCommandHistory();

      // Play it
      const result = await mcpClient.callTool("animation_control", {
        animationId,
        action: "play",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "animation_control"),
      ).toBe(true);
    });

    it("should pause a playing animation", async () => {
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        autoPlay: true,
      });
      const animationId = createResult.structuredContent.animationId;
      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("animation_control", {
        animationId,
        action: "pause",
      });

      expect(result.structuredContent.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "animation_control"),
      ).toBe(true);
    });
  });

  // ─── animation_list_active ──────────────────────────────────────────

  describe("animation_list_active", () => {
    it("should return an empty list when no animations exist", async () => {
      const result = await mcpClient.callTool("animation_list_active", {});

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(Array.isArray(resultData.animations)).toBe(true);
      expect(resultData.animations.length).toBe(0);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "animation_list_active"),
      ).toBe(true);
    });

    it("should list active animations after creating one", async () => {
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        name: "Listed Animation",
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;
      viewerClient.clearCommandHistory();

      const listResult = await mcpClient.callTool("animation_list_active", {});
      const listData = listResult.structuredContent;

      expect(listData.success).toBe(true);
      expect(listData.animations.length).toBeGreaterThan(0);
      const ids = listData.animations.map((a) => a.animationId);
      expect(ids).toContain(animationId);
    });
  });

  // ─── animation_remove ───────────────────────────────────────────────

  describe("animation_remove", () => {
    it("should remove an animation by ID", async () => {
      // Create first
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;
      const beforeCount = viewer.entities.values.length;
      viewerClient.clearCommandHistory();

      // Remove it
      const result = await mcpClient.callTool("animation_remove", {
        animationId,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "animation_remove"),
      ).toBe(true);

      // Entity should be removed from viewer
      expect(viewer.entities.values.length).toBe(beforeCount - 1);
    });
  });

  // ─── animation_update_path ──────────────────────────────────────────

  describe("animation_update_path", () => {
    it("should update path visualization on an existing animation", async () => {
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        showPath: true,
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;
      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("animation_update_path", {
        animationId,
        leadTime: 120,
        trailTime: 300,
        width: 5,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some((c: MCPCommand) => c.type === "animation_update_path"),
      ).toBe(true);
    });
  });

  // ─── animation_camera_tracking ──────────────────────────────────────

  describe("animation_camera_tracking", () => {
    it("should start tracking an animated entity with camera", async () => {
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;
      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("animation_camera_tracking", {
        animationId,
        track: true,
        range: 5000,
        pitch: -30,
        heading: 0,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some(
          (c: MCPCommand) => c.type === "animation_camera_tracking",
        ),
      ).toBe(true);
    });

    it("should stop tracking and restore camera control", async () => {
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        autoPlay: false,
      });
      const animationId = createResult.structuredContent.animationId;

      // Start tracking
      await mcpClient.callTool("animation_camera_tracking", {
        animationId,
        track: true,
      });
      viewerClient.clearCommandHistory();

      // Stop tracking
      const result = await mcpClient.callTool("animation_camera_tracking", {
        animationId,
        track: false,
      });

      expect(result.structuredContent.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(
        commands.some(
          (c: MCPCommand) => c.type === "animation_camera_tracking",
        ),
      ).toBe(true);
    });
  });

  // ─── Multi-tool Workflows ────────────────────────────────────────────

  describe("Multi-tool Workflows", () => {
    it("should configure clock, create animation, play, then pause", async () => {
      // Configure clock
      await mcpClient.callTool("clock_control", {
        action: "configure",
        clock: {
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T00:05:00Z",
          currentTime: "2024-01-01T00:00:00Z",
          clockRange: "LOOP_STOP",
          multiplier: 30,
          shouldAnimate: false,
        },
      });

      // Create animation
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        name: "Workflow Animation",
        autoPlay: false,
        speedMultiplier: 30,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;

      // Play
      const playResult = await mcpClient.callTool("animation_control", {
        animationId,
        action: "play",
      });
      expect(playResult.structuredContent.success).toBe(true);

      // Pause
      const pauseResult = await mcpClient.callTool("animation_control", {
        animationId,
        action: "pause",
      });
      expect(pauseResult.structuredContent.success).toBe(true);

      // Verify the animation is still in the list
      const listResult = await mcpClient.callTool("animation_list_active", {});
      const ids = listResult.structuredContent.animations.map(
        (a) => a.animationId,
      );
      expect(ids).toContain(animationId);
    });

    it("should create animation, track it, update path, then remove", async () => {
      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        showPath: true,
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;

      // Track with camera
      await mcpClient.callTool("animation_camera_tracking", {
        animationId,
        track: true,
        range: 2000,
      });

      // Update path appearance
      const pathResult = await mcpClient.callTool("animation_update_path", {
        animationId,
        trailTime: 180,
        width: 8,
      });
      expect(pathResult.structuredContent.success).toBe(true);

      // Stop tracking
      await mcpClient.callTool("animation_camera_tracking", {
        animationId,
        track: false,
      });

      // Remove animation
      const removeResult = await mcpClient.callTool("animation_remove", {
        animationId,
      });
      expect(removeResult.structuredContent.success).toBe(true);

      // List should be empty
      const listResult = await mcpClient.callTool("animation_list_active", {});
      const ids = listResult.structuredContent.animations.map(
        (a) => a.animationId,
      );
      expect(ids).not.toContain(animationId);
    });

    it("should enable lighting, create animation, list, and clean up", async () => {
      // Set scene atmosphere
      await mcpClient.callTool("globe_set_lighting", {
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: false,
      });

      const createResult = await mcpClient.callTool("animation_create", {
        positionSamples: SAMPLE_ROUTE,
        autoPlay: false,
      });
      expect(createResult.structuredContent.success).toBe(true);
      const animationId = createResult.structuredContent.animationId;

      const listResult = await mcpClient.callTool("animation_list_active", {});
      expect(
        listResult.structuredContent.animations.length,
      ).toBeGreaterThanOrEqual(1);

      const removeResult = await mcpClient.callTool("animation_remove", {
        animationId,
      });
      expect(removeResult.structuredContent.success).toBe(true);
    });
  });
});
