import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TerrainSetResponse } from "../../src/schemas/index";
import { registerTerrainSet } from "../../src/tools/terrain-set";

describe("registerTerrainSet", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TerrainSetResponse;
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

    registerTerrainSet(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Registration", () => {
    it('should register tool with name "terrain_set"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "terrain_set",
        expect.objectContaining({
          title: "Set Terrain Provider",
          description: expect.stringContaining("terrain provider"),
        }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should set Ion terrain provider", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        name: "Cesium World Terrain",
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
        name: "Cesium World Terrain",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.name).toBe("Cesium World Terrain");
      expect(response.structuredContent.sourceType).toBe("ion");
      expect(response.isError).toBe(false);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "terrain_set",
        sourceType: "ion",
        assetId: 1,
        name: "Cesium World Terrain",
      });
    });

    it("should set URL terrain provider", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        name: "Custom Terrain",
      });

      const response = await registeredHandler({
        type: "url",
        url: "https://example.com/terrain",
        name: "Custom Terrain",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.sourceType).toBe("url");
      expect(response.isError).toBe(false);
    });

    it("should set ellipsoid terrain provider", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        name: "WGS84 Ellipsoid",
      });

      const response = await registeredHandler({
        type: "ellipsoid",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.isError).toBe(false);
    });

    it("should pass vertex normals and water mask options", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        type: "ion",
        assetId: 1,
        requestVertexNormals: true,
        requestWaterMask: true,
        requestMetadata: false,
      });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        requestVertexNormals: true,
        requestWaterMask: true,
        requestMetadata: false,
      });
    });

    it("should use type as fallback name when no name provided", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
      });

      expect(response.structuredContent.name).toBe("ion");
    });
  });

  describe("Error handling", () => {
    it("should return error when ion type lacks assetId", async () => {
      const response = await registeredHandler({
        type: "ion",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("assetId");
      expect(response.isError).toBe(true);
    });

    it("should return error when url type lacks url", async () => {
      const response = await registeredHandler({
        type: "url",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("url");
      expect(response.isError).toBe(true);
    });

    it("should handle communication server errors", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Connection timeout",
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should handle thrown exceptions", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Network error"),
      );

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Network error");
      expect(response.isError).toBe(true);
    });
  });
});
