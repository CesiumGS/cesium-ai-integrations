/**
 * Entity Tools End-to-End Tests
 *
 * Tests every entity MCP server tool through the full flow:
 *   Test → MCP transport → Entity MCP Server → WebSocket → Cesium viewer
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
import CesiumEntityManager from "../../src/managers/entity-manager";
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
const SERVER_PORT = 4004;
const SERVER_URL = `ws://localhost:${SERVER_PORT}/mcp/ws`;
const ENTITY_SERVER_DIR = path.resolve(
  __dirname,
  "../../../../../servers/entity-server",
);

// Transport selection via environment variable (default: stdio)
const MCP_TRANSPORT = process.env.MCP_TRANSPORT || "stdio";

/** All tool names the entity server is expected to register. */
const ALL_ENTITY_TOOLS = [
  "entity_add_point",
  "entity_add_billboard",
  "entity_add_label",
  "entity_add_model",
  "entity_add_polygon",
  "entity_add_polyline",
  "entity_add_ellipse",
  "entity_add_rectangle",
  "entity_add_wall",
  "entity_add_cylinder",
  "entity_add_box",
  "entity_add_corridor",
  "entity_list",
  "entity_remove",
] as const;

function createMCPClient(): IMCPClient {
  if (MCP_TRANSPORT === "streamable-http") {
    console.log(`[Test] Using streamable-http transport`);
    return new HttpStreamableMCPClient({
      serverDir: ENTITY_SERVER_DIR,
      port: SERVER_PORT,
      clientName: "entity-e2e-test",
    });
  }

  console.log("[Test] Using stdio transport (spawning child process)");
  return new StdioMCPClient({
    serverDir: ENTITY_SERVER_DIR,
    port: SERVER_PORT,
    clientName: "entity-e2e-test",
  });
}

describe(`Entity Tools E2E [${MCP_TRANSPORT}]`, () => {
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

    const entityManager = new CesiumEntityManager(viewer);
    viewerClient = new TestWSViewerClient(entityManager, SERVER_URL);

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
    it("should list all entity tools from the MCP server", async () => {
      const result = await mcpClient.listTools();

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThanOrEqual(
        ALL_ENTITY_TOOLS.length,
      );

      const toolNames = result.tools.map((t) => t.name);
      for (const name of ALL_ENTITY_TOOLS) {
        expect(toolNames).toContain(name);
      }
    });

    it("should have client-side command handlers for all entity operations", () => {
      const entityManager = viewerClient.getManager<CesiumEntityManager>();
      const handlers = entityManager.getCommandHandlers();

      expect(handlers.has("entity_add")).toBe(true);
      expect(handlers.has("entity_remove")).toBe(true);
      expect(handlers.has("entity_list")).toBe(true);
    });
  });

  // ─── entity_add_point ───────────────────────────────────────────────

  describe("entity_add_point", () => {
    it("should add a point entity and dispatch entity_add command", async () => {
      const result = await mcpClient.callTool("entity_add_point", {
        position: { longitude: -73.9857, latitude: 40.7484, height: 0 },
        point: {
          pixelSize: 10,
          color: { red: 1, green: 0, blue: 0, alpha: 1 },
        },
        name: "Test Point",
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");

      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );

      // Verify entity was added to the viewer
      expect(viewer.entities.values.length).toBeGreaterThan(0);
    });

    it("should add a point with default appearance", async () => {
      const result = await mcpClient.callTool("entity_add_point", {
        position: { longitude: 10.0, latitude: 20.0, height: 100 },
      });

      expect(result.structuredContent.success).toBe(true);
      expect(result.structuredContent.entityId).toBeDefined();
    });
  });

  // ─── entity_add_label ───────────────────────────────────────────────

  describe("entity_add_label", () => {
    it("should add a label entity with text", async () => {
      const result = await mcpClient.callTool("entity_add_label", {
        position: { longitude: 2.3522, latitude: 48.8566, height: 0 },
        label: { text: "Paris", font: "14pt sans-serif" },
        name: "Paris Label",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });

    it("should add a label with custom styling", async () => {
      const result = await mcpClient.callTool("entity_add_label", {
        position: { longitude: 139.6917, latitude: 35.6895, height: 0 },
        label: {
          text: "Tokyo",
          font: "18pt Arial",
          fillColor: { red: 1, green: 1, blue: 0, alpha: 1 },
          scale: 1.2,
        },
        name: "Tokyo Label",
      });

      expect(result.structuredContent.success).toBe(true);
    });
  });

  // ─── entity_add_polygon ─────────────────────────────────────────────

  describe("entity_add_polygon", () => {
    it("should add a polygon entity with vertices", async () => {
      const result = await mcpClient.callTool("entity_add_polygon", {
        polygon: {
          hierarchy: [
            { longitude: -100, latitude: 40 },
            { longitude: -90, latitude: 40 },
            { longitude: -90, latitude: 30 },
            { longitude: -100, latitude: 30 },
          ],
          material: {
            type: "color",
            color: { red: 0, green: 0.5, blue: 1, alpha: 0.5 },
          },
        },
        name: "Test Polygon",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });

    it("should add a polygon with extrusion", async () => {
      const result = await mcpClient.callTool("entity_add_polygon", {
        polygon: {
          hierarchy: [
            { longitude: 0, latitude: 0 },
            { longitude: 1, latitude: 0 },
            { longitude: 1, latitude: 1 },
            { longitude: 0, latitude: 1 },
          ],
          extrudedHeight: 10000,
          outline: true,
        },
        name: "Extruded Polygon",
      });

      expect(result.structuredContent.success).toBe(true);
    });
  });

  // ─── entity_add_polyline ─────────────────────────────────────────────

  describe("entity_add_polyline", () => {
    it("should add a polyline entity", async () => {
      const result = await mcpClient.callTool("entity_add_polyline", {
        polyline: {
          positions: [
            { longitude: -122.4194, latitude: 37.7749 },
            { longitude: -118.2437, latitude: 34.0522 },
            { longitude: -87.6298, latitude: 41.8781 },
          ],
          width: 3,
        },
        name: "US Route",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_add_ellipse ─────────────────────────────────────────────

  describe("entity_add_ellipse", () => {
    it("should add an ellipse entity", async () => {
      const result = await mcpClient.callTool("entity_add_ellipse", {
        position: { longitude: 15.0, latitude: 45.0, height: 0 },
        ellipse: {
          semiMajorAxis: 500000,
          semiMinorAxis: 300000,
        },
        name: "Test Ellipse",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_add_rectangle ──────────────────────────────────────────

  describe("entity_add_rectangle", () => {
    it("should add a rectangle entity", async () => {
      const result = await mcpClient.callTool("entity_add_rectangle", {
        rectangle: {
          coordinates: { west: -110, south: 30, east: -100, north: 40 },
        },
        name: "Test Rectangle",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_add_wall ───────────────────────────────────────────────

  describe("entity_add_wall", () => {
    it("should add a wall entity", async () => {
      const result = await mcpClient.callTool("entity_add_wall", {
        wall: {
          positions: [
            { longitude: -100, latitude: 40, height: 0 },
            { longitude: -90, latitude: 40, height: 0 },
            { longitude: -80, latitude: 35, height: 0 },
          ],
          maximumHeights: [100000, 100000, 100000],
          minimumHeights: [0, 0, 0],
        },
        name: "Test Wall",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_add_cylinder ──────────────────────────────────────────

  describe("entity_add_cylinder", () => {
    it("should add a cylinder entity", async () => {
      const result = await mcpClient.callTool("entity_add_cylinder", {
        position: { longitude: 30.0, latitude: 50.0, height: 200000 },
        cylinder: {
          length: 400000,
          topRadius: 200000,
          bottomRadius: 200000,
        },
        name: "Test Cylinder",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_add_box ───────────────────────────────────────────────

  describe("entity_add_box", () => {
    it("should add a box entity", async () => {
      const result = await mcpClient.callTool("entity_add_box", {
        position: { longitude: 25.0, latitude: 55.0, height: 150000 },
        box: {
          dimensions: { x: 400000, y: 300000, z: 200000 },
        },
        name: "Test Box",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_add_corridor ─────────────────────────────────────────

  describe("entity_add_corridor", () => {
    it("should add a corridor entity", async () => {
      const result = await mcpClient.callTool("entity_add_corridor", {
        corridor: {
          positions: [
            { longitude: -100, latitude: 40 },
            { longitude: -95, latitude: 42 },
            { longitude: -90, latitude: 40 },
          ],
          width: 200000,
        },
        name: "Test Corridor",
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entityId).toBeDefined();

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_add")).toBe(
        true,
      );
    });
  });

  // ─── entity_list ─────────────────────────────────────────────────

  describe("entity_list", () => {
    it("should list zero entities when scene is empty", async () => {
      const result = await mcpClient.callTool("entity_list", {});

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      expect(resultData.entities).toBeDefined();
      expect(Array.isArray(resultData.entities)).toBe(true);
      expect(resultData.totalCount).toBe(0);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_list")).toBe(
        true,
      );
    });

    it("should list entities after adding some", async () => {
      // Add a couple of entities first
      const add1 = await mcpClient.callTool("entity_add_point", {
        position: { longitude: 0, latitude: 0, height: 0 },
        name: "Point A",
      });
      const add2 = await mcpClient.callTool("entity_add_point", {
        position: { longitude: 10, latitude: 10, height: 0 },
        name: "Point B",
      });
      expect(add1.structuredContent.success).toBe(true);
      expect(add2.structuredContent.success).toBe(true);

      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("entity_list", {});
      const resultData = result.structuredContent;

      expect(resultData.success).toBe(true);
      expect(resultData.totalCount).toBeGreaterThanOrEqual(2);
      expect(resultData.entities.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by entity type", async () => {
      await mcpClient.callTool("entity_add_point", {
        position: { longitude: 5, latitude: 5, height: 0 },
        name: "My Point",
      });

      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("entity_list", {
        filterByType: "point",
      });

      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);
      // filteredCount reflects only the matching type
      expect(resultData.filteredCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── entity_remove ────────────────────────────────────────────────

  describe("entity_remove", () => {
    it("should remove an entity by ID", async () => {
      // First add an entity
      const addResult = await mcpClient.callTool("entity_add_point", {
        position: { longitude: 20.0, latitude: 30.0, height: 0 },
        name: "Remove Me",
      });
      expect(addResult.structuredContent.success).toBe(true);
      const entityId = addResult.structuredContent.entityId;

      viewerClient.clearCommandHistory();
      const beforeCount = viewer.entities.values.length;

      // Now remove it
      const result = await mcpClient.callTool("entity_remove", {
        entityId,
      });

      expect(result.content).toBeDefined();
      const resultData = result.structuredContent;
      expect(resultData.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_remove")).toBe(
        true,
      );

      // Entity count should decrease
      expect(viewer.entities.values.length).toBe(beforeCount - 1);
    });

    it("should remove entities by name pattern", async () => {
      // Add entities with a shared name prefix
      await mcpClient.callTool("entity_add_point", {
        position: { longitude: 1, latitude: 1 },
        name: "zone-north",
      });
      await mcpClient.callTool("entity_add_point", {
        position: { longitude: 2, latitude: 2 },
        name: "zone-south",
      });

      viewerClient.clearCommandHistory();

      const result = await mcpClient.callTool("entity_remove", {
        namePattern: "zone-",
        removeAll: true,
      });

      expect(result.structuredContent.success).toBe(true);

      const commands = viewerClient.getCommandsReceived();
      expect(commands.some((c: MCPCommand) => c.type === "entity_remove")).toBe(
        true,
      );
    });

    it("should fail gracefully when entity ID does not exist", async () => {
      const result = await mcpClient.callTool("entity_remove", {
        entityId: "non_existent_id_12345",
      });

      // The call should not throw — success or handled error
      expect(result.content).toBeDefined();
    });
  });

  // ─── Multi-tool Workflows ─────────────────────────────────────────

  describe("Multi-tool Workflows", () => {
    it("should add multiple entity types and verify list count", async () => {
      await mcpClient.callTool("entity_add_point", {
        position: { longitude: 0, latitude: 0 },
        name: "WF Point",
      });
      await mcpClient.callTool("entity_add_label", {
        position: { longitude: 5, latitude: 5 },
        label: { text: "WF Label" },
        name: "WF Label",
      });
      await mcpClient.callTool("entity_add_polygon", {
        polygon: {
          hierarchy: [
            { longitude: 10, latitude: 10 },
            { longitude: 20, latitude: 10 },
            { longitude: 20, latitude: 20 },
          ],
        },
        name: "WF Polygon",
      });

      const listResult = await mcpClient.callTool("entity_list", {});
      expect(listResult.structuredContent.success).toBe(true);
      expect(listResult.structuredContent.totalCount).toBeGreaterThanOrEqual(3);
    });

    it("should add an entity, list it, then remove it", async () => {
      const addResult = await mcpClient.callTool("entity_add_point", {
        position: { longitude: -90, latitude: 45 },
        name: "Lifecycle Point",
      });
      expect(addResult.structuredContent.success).toBe(true);
      const entityId = addResult.structuredContent.entityId;

      // Confirm the entity appears in list
      const listResult = await mcpClient.callTool("entity_list", {});
      const ids = (
        listResult.structuredContent.entities as Array<{ id: string }>
      ).map((e) => e.id);
      expect(ids).toContain(entityId);

      // Remove it
      const removeResult = await mcpClient.callTool("entity_remove", {
        entityId,
      });
      expect(removeResult.structuredContent.success).toBe(true);

      // Confirm it is gone
      expect(viewer.entities.getById(entityId)).toBeUndefined();
    });
  });
});
