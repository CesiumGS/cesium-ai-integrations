/**
 * Unit Tests for Entity Manager
 * Tests all command handler functions for entity creation, removal, and listing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import CesiumEntityManager from "../../src/managers/entity-manager";
import type { CesiumViewer } from "../../src/types/cesium-types";
import type { MCPCommand } from "../../src/types/mcp";
import * as entityUtils from "../../src/shared/entity-utils";

// ---- Module mocks ----

let entityIdCounter = 0;
function makeMockEntity(
  overrides: Partial<{
    id: string;
    name: string;
    point?: object;
    label?: object;
    polygon?: object;
    polyline?: object;
    model?: object;
  }> = {},
) {
  return {
    id: overrides.id ?? `entity-${++entityIdCounter}`,
    name: overrides.name ?? "Mock Entity",
    ...overrides,
  };
}

vi.mock("../../src/shared/cesium-utils", () => ({
  cartesian3ToPosition: vi.fn((_cartesian: unknown) => ({
    longitude: -105.0,
    latitude: 39.0,
    height: 1000,
  })),
}));

vi.mock("../../src/shared/entity-utils", () => ({
  addPointEntity: vi.fn(() => makeMockEntity({ name: "Point" })),
  addLabelEntity: vi.fn(() => makeMockEntity({ name: "Label" })),
  addPolygonEntity: vi.fn(() => makeMockEntity({ name: "Polygon" })),
  addPolylineEntity: vi.fn(() => makeMockEntity({ name: "Polyline" })),
  addBillboardEntity: vi.fn(() => makeMockEntity({ name: "Billboard" })),
  addModelEntity: vi.fn(() => makeMockEntity({ name: "3D Model" })),
  addEllipseEntity: vi.fn(() => makeMockEntity({ name: "Ellipse" })),
  addRectangleEntity: vi.fn(() => makeMockEntity({ name: "Rectangle" })),
  addWallEntity: vi.fn(() => makeMockEntity({ name: "Wall" })),
  addCylinderEntity: vi.fn(() => makeMockEntity({ name: "Cylinder" })),
  addBoxEntity: vi.fn(() => makeMockEntity({ name: "Box" })),
  addCorridorEntity: vi.fn(() => makeMockEntity({ name: "Corridor" })),
}));

// ---- Tests ----

describe("Entity Manager Unit Tests", () => {
  let entityManager: CesiumEntityManager;
  let mockViewer: CesiumViewer;
  let commandHandlers: Map<string, (cmd: MCPCommand) => unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    entityIdCounter = 0;

    mockViewer = {
      entities: {
        getById: vi.fn(),
        remove: vi.fn(() => true),
        values: [] as unknown[],
      },
    } as unknown as CesiumViewer;

    entityManager = new CesiumEntityManager(mockViewer);
    commandHandlers = entityManager.getCommandHandlers() as Map<
      string,
      (cmd: MCPCommand) => unknown
    >;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Handler registration
  // ───────────────────────────────────────────────────────────────────────────

  describe("Command handler registration", () => {
    it("should register all required entity command handlers", () => {
      const required = ["entity_add", "entity_remove", "entity_list"];
      for (const name of required) {
        expect(commandHandlers.has(name)).toBe(true);
        expect(typeof commandHandlers.get(name)).toBe("function");
      }
    });

    it("should have the correct number of handlers", () => {
      expect(commandHandlers.size).toBe(3);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — point
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – point", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a point entity with explicit entityType", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "point",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        point: { pixelSize: 12, color: "red" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
        entityId: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("point");
      expect(result.entityId).toBeDefined();
      expect(entityUtils.addPointEntity).toHaveBeenCalledOnce();
    });

    it("should auto-detect point entity type from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        point: { pixelSize: 10, color: "yellow" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("point");
    });

    it("should return error when position is missing for point", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "point",
        // position omitted
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });

    it("should pass all point options to addPointEntity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "point",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        id: "my-custom-point",
        name: "Custom Point",
        point: {
          pixelSize: 20,
          color: "blue",
          outlineColor: "white",
          outlineWidth: 3,
        },
      };
      await addHandler()(cmd);

      expect(entityUtils.addPointEntity).toHaveBeenCalledWith(
        mockViewer,
        { longitude: -105.0, latitude: 39.0, height: 0 },
        expect.objectContaining({
          id: "my-custom-point",
          name: "Custom Point",
          pixelSize: 20,
        }),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — label
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – label", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a label entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "label",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        label: {
          text: "Hello World",
          font: "14pt sans-serif",
          fillColor: "white",
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("label");
      expect(entityUtils.addLabelEntity).toHaveBeenCalledOnce();
    });

    it("should auto-detect label entity type from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        label: { text: "Auto Label" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("label");
    });

    it("should return error when text is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "label",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        label: {}, // no text
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Text is required");
    });

    it("should return error when position is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "label",
        label: { text: "No Position" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — polygon
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – polygon", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    const polygonCoords = [
      { longitude: -105.0, latitude: 39.0, height: 0 },
      { longitude: -104.0, latitude: 39.0, height: 0 },
      { longitude: -104.0, latitude: 40.0, height: 0 },
      { longitude: -105.0, latitude: 40.0, height: 0 },
    ];

    it("should create a polygon entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "polygon",
        polygon: {
          hierarchy: polygonCoords,
          fillColor: "rgba(0,255,0,0.5)",
          outline: true,
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("polygon");
      expect(entityUtils.addPolygonEntity).toHaveBeenCalledOnce();
    });

    it("should return error when coordinates are missing", async () => {
      const cmd: MCPCommand = { type: "entity_add", entityType: "polygon" };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Coordinates are required");
    });

    it("should auto-detect polygon from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        polygon: { hierarchy: polygonCoords },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("polygon");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — polyline
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – polyline", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    const lineCoords = [
      { longitude: -105.0, latitude: 39.0, height: 0 },
      { longitude: -104.0, latitude: 40.0, height: 0 },
    ];

    it("should create a polyline entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "polyline",
        polyline: {
          positions: lineCoords,
          width: 3,
          color: "red",
          clampToGround: true,
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("polyline");
      expect(entityUtils.addPolylineEntity).toHaveBeenCalledOnce();
    });

    it("should return error when positions are missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "polyline",
        polyline: {},
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Coordinates are required");
    });

    it("should auto-detect polyline from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        polyline: { positions: lineCoords },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("polyline");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — billboard
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – billboard", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a billboard entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "billboard",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        billboard: { image: "https://example.com/icon.png", scale: 1.5 },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("billboard");
      expect(entityUtils.addBillboardEntity).toHaveBeenCalledOnce();
    });

    it("should return error when position is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "billboard",
        billboard: { image: "icon.png" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });

    it("should return error when image URL is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "billboard",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        billboard: {}, // no image
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Image URL is required");
    });

    it("should auto-detect billboard from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        billboard: { image: "icon.png" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("billboard");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — model
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – model", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a 3D model entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "model",
        position: { longitude: -105.0, latitude: 39.0, height: 100 },
        model: {
          uri: "Assets/Models/Cesium_Air.glb",
          scale: 2.0,
          minimumPixelSize: 64,
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("model");
      expect(entityUtils.addModelEntity).toHaveBeenCalledOnce();
    });

    it("should return error when position is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "model",
        model: { uri: "model.glb" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });

    it("should return error when model URI is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "model",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        model: {}, // no uri
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Model URI is required");
    });

    it("should auto-detect model from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        model: { uri: "model.glb" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("model");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — ellipse
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – ellipse", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create an ellipse entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "ellipse",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        ellipse: {
          semiMajorAxis: 500,
          semiMinorAxis: 300,
          fillColor: "rgba(255,0,0,0.4)",
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("ellipse");
      expect(entityUtils.addEllipseEntity).toHaveBeenCalledOnce();
    });

    it("should return error when position is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "ellipse",
        ellipse: { semiMajorAxis: 500, semiMinorAxis: 300 },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });

    it("should return error when semiMajorAxis or semiMinorAxis is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "ellipse",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        ellipse: { semiMajorAxis: 500 }, // semiMinorAxis missing
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "semiMajorAxis and semiMinorAxis are required",
      );
    });

    it("should auto-detect ellipse from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        ellipse: { semiMajorAxis: 500, semiMinorAxis: 300 },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("ellipse");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — rectangle
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – rectangle", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a rectangle entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "rectangle",
        rectangle: {
          coordinates: { west: -106, south: 39, east: -104, north: 41 },
          fillColor: "rgba(0,0,255,0.3)",
          outline: true,
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("rectangle");
      expect(entityUtils.addRectangleEntity).toHaveBeenCalledOnce();
    });

    it("should return error when coordinates are missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "rectangle",
        rectangle: {}, // no coordinates
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Coordinates are required");
    });

    it("should auto-detect rectangle from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        rectangle: {
          coordinates: { west: -106, south: 39, east: -104, north: 41 },
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("rectangle");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — wall
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – wall", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    const wallPositions = [
      { longitude: -105.0, latitude: 39.0, height: 0 },
      { longitude: -104.0, latitude: 39.0, height: 0 },
      { longitude: -104.0, latitude: 40.0, height: 0 },
    ];

    it("should create a wall entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "wall",
        wall: {
          positions: wallPositions,
          maximumHeights: [1000, 1000, 1000],
          minimumHeights: [0, 0, 0],
          fillColor: "white",
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("wall");
      expect(entityUtils.addWallEntity).toHaveBeenCalledOnce();
    });

    it("should return error when positions are missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "wall",
        wall: {}, // no positions
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Positions are required");
    });

    it("should auto-detect wall from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        wall: { positions: wallPositions },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("wall");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — cylinder
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – cylinder", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a cylinder entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "cylinder",
        position: { longitude: -105.0, latitude: 39.0, height: 500 },
        cylinder: {
          length: 1000,
          topRadius: 100,
          bottomRadius: 200,
          fillColor: "orange",
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("cylinder");
      expect(entityUtils.addCylinderEntity).toHaveBeenCalledOnce();
    });

    it("should return error when position is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "cylinder",
        cylinder: { length: 1000, topRadius: 100, bottomRadius: 200 },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });

    it("should return error when required cylinder dimensions are missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "cylinder",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        cylinder: { length: 1000, topRadius: 100 }, // bottomRadius missing
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Length, topRadius, and bottomRadius are required",
      );
    });

    it("should auto-detect cylinder from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        cylinder: { length: 1000, topRadius: 100, bottomRadius: 200 },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("cylinder");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — box
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – box", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    it("should create a box entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "box",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        box: { dimensions: { x: 500, y: 500, z: 500 }, fillColor: "gray" },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("box");
      expect(entityUtils.addBoxEntity).toHaveBeenCalledOnce();
    });

    it("should return error when position is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "box",
        box: { dimensions: { x: 100, y: 100, z: 100 } },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Position is required");
    });

    it("should return error when dimensions are missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "box",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        box: {}, // no dimensions
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Dimensions are required");
    });

    it("should auto-detect box from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
        box: { dimensions: { x: 100, y: 100, z: 100 } },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("box");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — corridor
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – corridor", () => {
    const addHandler = () => commandHandlers.get("entity_add")!;

    const corridorPositions = [
      { longitude: -105.0, latitude: 39.0, height: 0 },
      { longitude: -104.0, latitude: 40.0, height: 0 },
    ];

    it("should create a corridor entity", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "corridor",
        corridor: {
          positions: corridorPositions,
          width: 200,
          fillColor: "lime",
        },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("corridor");
      expect(entityUtils.addCorridorEntity).toHaveBeenCalledOnce();
    });

    it("should return error when positions or width is missing", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "corridor",
        corridor: { positions: corridorPositions }, // width missing
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Positions and width are required");
    });

    it("should auto-detect corridor from structure", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        corridor: { positions: corridorPositions, width: 100 },
      };
      const result = (await addHandler()(cmd)) as {
        success: boolean;
        type: string;
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe("corridor");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_add — unknown type
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_add – unknown type", () => {
    it("should return error for unknown entity type", async () => {
      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "sphere", // unsupported
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
      };
      const result = (await commandHandlers.get("entity_add")!(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown entity type: sphere");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_remove
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_remove handler", () => {
    const handler = () => commandHandlers.get("entity_remove")!;

    it("should register the entity_remove handler", () => {
      expect(commandHandlers.has("entity_remove")).toBe(true);
    });

    describe("remove by entityId", () => {
      it("should remove an existing entity by ID", async () => {
        const mockEntity = { id: "entity-abc", name: "Test Entity" };
        vi.mocked(
          mockViewer.entities.getById as ReturnType<typeof vi.fn>,
        ).mockReturnValue(mockEntity);

        const cmd: MCPCommand = {
          type: "entity_remove",
          entityId: "entity-abc",
        };
        const result = (await handler()(cmd)) as {
          success: boolean;
          entityId: string;
          message: string;
        };

        expect(result.success).toBe(true);
        expect(result.entityId).toBe("entity-abc");
        expect(result.message).toContain("entity-abc");
        expect(mockViewer.entities.remove).toHaveBeenCalledWith(mockEntity);
      });

      it("should return error when entity ID is not found", async () => {
        vi.mocked(
          mockViewer.entities.getById as ReturnType<typeof vi.fn>,
        ).mockReturnValue(undefined);

        const cmd: MCPCommand = {
          type: "entity_remove",
          entityId: "ghost-entity",
        };
        const result = (await handler()(cmd)) as {
          success: boolean;
          error: string;
        };

        expect(result.success).toBe(false);
        expect(result.error).toContain("ghost-entity");
        expect(result.error).toContain("not found");
      });
    });

    describe("remove by namePattern", () => {
      it("should remove all entities matching a name pattern", async () => {
        const e1 = { id: "e1", name: "Route Marker A" };
        const e2 = { id: "e2", name: "Route Marker B" };
        const e3 = { id: "e3", name: "Unrelated Entity" };
        (mockViewer.entities as unknown as Record<string, unknown>).values = [
          e1,
          e2,
          e3,
        ];

        const cmd: MCPCommand = {
          type: "entity_remove",
          namePattern: "Route Marker",
        };
        const result = (await handler()(cmd)) as {
          success: boolean;
          removedCount: number;
          removedIds: string[];
          message: string;
        };

        expect(result.success).toBe(true);
        expect(result.removedCount).toBe(2);
        expect(result.removedIds).toContain("e1");
        expect(result.removedIds).toContain("e2");
        expect(mockViewer.entities.remove).toHaveBeenCalledTimes(2);
      });

      it("should return zero count when no entities match the pattern", async () => {
        const e1 = { id: "e1", name: "Some Entity" };
        (mockViewer.entities as unknown as Record<string, unknown>).values = [
          e1,
        ];

        const cmd: MCPCommand = {
          type: "entity_remove",
          namePattern: "NonExistent",
        };
        const result = (await handler()(cmd)) as {
          success: boolean;
          removedCount: number;
        };

        expect(result.success).toBe(true);
        expect(result.removedCount).toBe(0);
        expect(mockViewer.entities.remove).not.toHaveBeenCalled();
      });

      it("should handle empty entity collection for namePattern removal", async () => {
        (mockViewer.entities as unknown as Record<string, unknown>).values = [];

        const cmd: MCPCommand = {
          type: "entity_remove",
          namePattern: "TestPattern",
        };
        const result = (await handler()(cmd)) as {
          success: boolean;
          removedCount: number;
        };

        expect(result.success).toBe(true);
        expect(result.removedCount).toBe(0);
      });
    });

    describe("missing parameters", () => {
      it("should return error when neither entityId nor namePattern is provided", async () => {
        const cmd: MCPCommand = { type: "entity_remove" };
        const result = (await handler()(cmd)) as {
          success: boolean;
          error: string;
        };

        expect(result.success).toBe(false);
        expect(result.error).toContain("entityId or namePattern");
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // entity_list
  // ───────────────────────────────────────────────────────────────────────────

  describe("entity_list handler", () => {
    const handler = () => commandHandlers.get("entity_list")!;

    it("should register the entity_list handler", () => {
      expect(commandHandlers.has("entity_list")).toBe(true);
    });

    it("should return empty list when no entities exist", async () => {
      (mockViewer.entities as unknown as Record<string, unknown>).values = [];

      const result = (await handler()({} as MCPCommand)) as {
        success: boolean;
        entities: unknown[];
        totalCount: number;
        message: string;
      };

      expect(result.success).toBe(true);
      expect(result.entities).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.message).toContain("0 entities");
    });

    it("should list all entities with id, name, and type", async () => {
      const e1 = { id: "pt1", name: "My Point", point: {} };
      const e2 = { id: "lb1", name: "My Label", label: {} };
      const e3 = { id: "pg1", name: "My Polygon", polygon: {} };
      (mockViewer.entities as unknown as Record<string, unknown>).values = [
        e1,
        e2,
        e3,
      ];

      const result = (await handler()({} as MCPCommand)) as {
        success: boolean;
        entities: { id: string; name: string; type: string }[];
        totalCount: number;
      };

      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(3);

      const byId = Object.fromEntries(result.entities.map((e) => [e.id, e]));
      expect(byId["pt1"].type).toBe("point");
      expect(byId["lb1"].type).toBe("label");
      expect(byId["pg1"].type).toBe("polygon");
    });

    it("should include position when entity has one", async () => {
      const mockPosition = { x: 100, y: 200, z: 300 };
      const e1 = {
        id: "pos-entity",
        name: "Positioned Entity",
        point: {},
        position: { getValue: vi.fn(() => mockPosition) },
      };
      (mockViewer.entities as unknown as Record<string, unknown>).values = [e1];

      const result = (await handler()({} as MCPCommand)) as {
        entities: { id: string; position?: object }[];
      };

      expect(result.entities[0].position).toBeDefined();
    });

    it("should not include position when entity getValue returns null", async () => {
      const e1 = {
        id: "no-pos",
        name: "No Position",
        point: {},
        position: { getValue: vi.fn(() => null) },
      };
      (mockViewer.entities as unknown as Record<string, unknown>).values = [e1];

      const result = (await handler()({} as MCPCommand)) as {
        entities: { id: string; position?: object }[];
      };

      expect(result.entities[0].position).toBeUndefined();
    });

    it("should handle entities without a position property", async () => {
      const e1 = { id: "no-pos-prop", name: "No Position Prop", polygon: {} };
      (mockViewer.entities as unknown as Record<string, unknown>).values = [e1];

      const result = (await handler()({} as MCPCommand)) as {
        success: boolean;
        entities: { id: string }[];
      };

      expect(result.success).toBe(true);
      expect(result.entities).toHaveLength(1);
    });

    it("should detect all supported entity types", async () => {
      const entities = [
        { id: "1", name: "Point", point: {} },
        { id: "2", name: "Label", label: {} },
        { id: "3", name: "Polygon", polygon: {} },
        { id: "4", name: "Polyline", polyline: {} },
        { id: "5", name: "Billboard", billboard: {} },
        { id: "6", name: "Model", model: {} },
        { id: "7", name: "Ellipse", ellipse: {} },
        { id: "8", name: "Rectangle", rectangle: {} },
        { id: "9", name: "Wall", wall: {} },
        { id: "10", name: "Cylinder", cylinder: {} },
        { id: "11", name: "Box", box: {} },
        { id: "12", name: "Corridor", corridor: {} },
        { id: "13", name: "Unknown" },
      ];
      (mockViewer.entities as unknown as Record<string, unknown>).values =
        entities;

      const result = (await handler()({} as MCPCommand)) as {
        entities: { id: string; type: string }[];
      };

      const byId = Object.fromEntries(
        result.entities.map((e) => [e.id, e.type]),
      );
      expect(byId["1"]).toBe("point");
      expect(byId["2"]).toBe("label");
      expect(byId["3"]).toBe("polygon");
      expect(byId["4"]).toBe("polyline");
      expect(byId["5"]).toBe("billboard");
      expect(byId["6"]).toBe("model");
      expect(byId["7"]).toBe("ellipse");
      expect(byId["8"]).toBe("rectangle");
      expect(byId["9"]).toBe("wall");
      expect(byId["10"]).toBe("cylinder");
      expect(byId["11"]).toBe("box");
      expect(byId["12"]).toBe("corridor");
      expect(byId["13"]).toBe("unknown");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Error handling
  // ───────────────────────────────────────────────────────────────────────────

  describe("Error handling", () => {
    it("entity_add should return structured error when addPointEntity throws", async () => {
      vi.mocked(entityUtils.addPointEntity).mockImplementationOnce(() => {
        throw new Error("Cesium point error");
      });

      const cmd: MCPCommand = {
        type: "entity_add",
        entityType: "point",
        position: { longitude: -105.0, latitude: 39.0, height: 0 },
      };
      const result = (await commandHandlers.get("entity_add")!(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cesium point error");
    });

    it("entity_remove should return error when viewer.entities.remove throws", async () => {
      const mockEntity = { id: "bad-remove", name: "Entity" };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(mockEntity);
      vi.mocked(
        mockViewer.entities.remove as ReturnType<typeof vi.fn>,
      ).mockImplementationOnce(() => {
        throw new Error("Remove failed");
      });

      const cmd: MCPCommand = { type: "entity_remove", entityId: "bad-remove" };
      const result = (await commandHandlers.get("entity_remove")!(cmd)) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Remove failed");
    });
  });
});
