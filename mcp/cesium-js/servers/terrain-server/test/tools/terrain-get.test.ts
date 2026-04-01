import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TerrainGetResponse } from "../../src/schemas/index";
import { registerTerrainGet } from "../../src/tools/terrain-get";

describe("registerTerrainGet", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TerrainGetResponse;
    isError: boolean;
  }>;

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn((_name, _config, handler) => {
        registeredHandler = handler;
      }),
    };
    mockCommunicationServer = {
      executeCommand: vi.fn(),
    };

    registerTerrainGet(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Registration", () => {
    it('should register tool with name "terrain_get"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "terrain_get",
        expect.objectContaining({
          title: "Get Terrain Provider",
        }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should return current terrain information", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        terrain: {
          sourceType: "ion",
          name: "Cesium World Terrain",
          assetId: 1,
          hasVertexNormals: true,
          hasWaterMask: false,
          hasMetadata: true,
        },
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.terrain).toBeDefined();
      expect(response.structuredContent.terrain?.sourceType).toBe("ion");
      expect(response.structuredContent.terrain?.name).toBe(
        "Cesium World Terrain",
      );
      expect(response.isError).toBe(false);
    });

    it("should handle ellipsoid terrain", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        terrain: {
          sourceType: "ellipsoid",
          name: "WGS84 Ellipsoid",
          hasVertexNormals: false,
          hasWaterMask: false,
        },
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.terrain?.sourceType).toBe("ellipsoid");
    });
  });

  describe("Error handling", () => {
    it("should handle communication server errors", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Not connected",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should handle thrown exceptions", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Timeout"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Timeout");
    });
  });
});
