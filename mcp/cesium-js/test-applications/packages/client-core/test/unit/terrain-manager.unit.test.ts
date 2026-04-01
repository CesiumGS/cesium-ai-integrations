/**
 * Unit Tests for Terrain Manager MCP Communication
 * Tests request/response handling between terrain manager and MCP server
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import CesiumTerrainManager from "../../src/managers/terrain-manager";
import type { CesiumViewer } from "../../src/types/cesium-types";
import type { MCPCommand } from "../../src/types/mcp";
import type {
  TerrainSetResult,
  TerrainGetResult,
  TerrainRemoveResult,
} from "../../src/types/terrain-types";

// Mock Cesium module
vi.mock("cesium", () => {
  class MockTerrainProvider {
    hasVertexNormals = false;
    hasWaterMask = false;
    hasMetadata = false;
  }

  class MockCesiumTerrainProvider extends MockTerrainProvider {
    hasVertexNormals = true;
    hasMetadata = true;

    static async fromIonAssetId(
      assetId: number,
      options?: {
        requestVertexNormals?: boolean;
        requestWaterMask?: boolean;
        requestMetadata?: boolean;
      },
    ) {
      const provider = new MockCesiumTerrainProvider();
      provider.hasVertexNormals = options?.requestVertexNormals ?? true;
      provider.hasWaterMask = options?.requestWaterMask ?? false;
      provider.hasMetadata = options?.requestMetadata ?? true;
      return provider;
    }

    static async fromUrl(
      url: string,
      options?: {
        requestVertexNormals?: boolean;
        requestWaterMask?: boolean;
        requestMetadata?: boolean;
      },
    ) {
      const provider = new MockCesiumTerrainProvider();
      provider.hasVertexNormals = options?.requestVertexNormals ?? true;
      provider.hasWaterMask = options?.requestWaterMask ?? false;
      provider.hasMetadata = options?.requestMetadata ?? true;
      return provider;
    }
  }

  class MockEllipsoidTerrainProvider extends MockTerrainProvider {}

  class MockArcGISTiledElevationTerrainProvider extends MockTerrainProvider {}

  return {
    CesiumTerrainProvider: MockCesiumTerrainProvider,
    EllipsoidTerrainProvider: MockEllipsoidTerrainProvider,
    ArcGISTiledElevationTerrainProvider:
      MockArcGISTiledElevationTerrainProvider,
    TerrainProvider: MockTerrainProvider,
  };
});

function createMockViewer(): CesiumViewer {
  return {
    scene: {
      terrainProvider: new (vi.fn())(),
    },
  } as unknown as CesiumViewer;
}

describe("CesiumTerrainManager", () => {
  let manager: CesiumTerrainManager;
  let mockViewer: CesiumViewer;
  let commandHandlers: Map<
    string,
    (cmd: MCPCommand) => Promise<unknown> | unknown
  >;

  beforeEach(() => {
    mockViewer = createMockViewer();
    manager = new CesiumTerrainManager(mockViewer);
    manager.setUp();
    commandHandlers = manager.getCommandHandlers();
  });

  describe("Command registration", () => {
    it("should register terrain_set handler", () => {
      expect(commandHandlers.has("terrain_set")).toBe(true);
    });

    it("should register terrain_get handler", () => {
      expect(commandHandlers.has("terrain_get")).toBe(true);
    });

    it("should register terrain_remove handler", () => {
      expect(commandHandlers.has("terrain_remove")).toBe(true);
    });
  });

  describe("terrain_set", () => {
    it("should set Ion terrain provider", async () => {
      const handler = commandHandlers.get("terrain_set")!;
      const result = (await handler({
        type: "terrain_set",
        sourceType: "ion",
        assetId: 1,
        name: "Cesium World Terrain",
      })) as TerrainSetResult;

      expect(result.success).toBe(true);
      expect(result.name).toBe("Cesium World Terrain");
    });

    it("should set URL terrain provider", async () => {
      const handler = commandHandlers.get("terrain_set")!;
      const result = (await handler({
        type: "terrain_set",
        sourceType: "url",
        url: "https://example.com/terrain",
        name: "Custom Terrain",
      })) as TerrainSetResult;

      expect(result.success).toBe(true);
      expect(result.name).toBe("Custom Terrain");
    });

    it("should set ellipsoid terrain provider", async () => {
      const handler = commandHandlers.get("terrain_set")!;
      const result = (await handler({
        type: "terrain_set",
        sourceType: "ellipsoid",
      })) as TerrainSetResult;

      expect(result.success).toBe(true);
    });

    it("should return error when ion lacks assetId", async () => {
      const handler = commandHandlers.get("terrain_set")!;
      const result = (await handler({
        type: "terrain_set",
        sourceType: "ion",
      })) as TerrainSetResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain("assetId");
    });

    it("should return error when url lacks url", async () => {
      const handler = commandHandlers.get("terrain_set")!;
      const result = (await handler({
        type: "terrain_set",
        sourceType: "url",
      })) as TerrainSetResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain("url");
    });

    it("should return error for unsupported source type", async () => {
      const handler = commandHandlers.get("terrain_set")!;
      const result = (await handler({
        type: "terrain_set",
        sourceType: "unknown",
      })) as TerrainSetResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported");
    });
  });

  describe("terrain_get", () => {
    it("should return current terrain information", () => {
      const handler = commandHandlers.get("terrain_get")!;
      const result = handler({
        type: "terrain_get",
      }) as TerrainGetResult;

      expect(result.success).toBe(true);
      expect(result.terrain).toBeDefined();
      expect(result.terrain?.sourceType).toBeDefined();
    });
  });

  describe("terrain_remove", () => {
    it("should reset terrain to ellipsoid", () => {
      const handler = commandHandlers.get("terrain_remove")!;
      const result = handler({
        type: "terrain_remove",
      }) as TerrainRemoveResult;

      expect(result.success).toBe(true);
      expect(result.message).toContain("ellipsoid");
    });
  });
});
