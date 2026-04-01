import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TerrainRemoveResponse } from "../../src/schemas/index";
import { registerTerrainRemove } from "../../src/tools/terrain-remove";

describe("registerTerrainRemove", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TerrainRemoveResponse;
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

    registerTerrainRemove(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Registration", () => {
    it('should register tool with name "terrain_remove"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "terrain_remove",
        expect.objectContaining({
          title: "Remove Terrain Provider",
        }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should remove terrain and reset to ellipsoid", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        previousSourceType: "ion",
        previousName: "Cesium World Terrain",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.previousSourceType).toBe("ion");
      expect(response.structuredContent.previousName).toBe(
        "Cesium World Terrain",
      );
      expect(response.structuredContent.message).toContain("ellipsoid");
      expect(response.isError).toBe(false);
    });

    it("should handle remove when no previous name", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        previousSourceType: "ellipsoid",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("ellipsoid");
    });
  });

  describe("Error handling", () => {
    it("should handle communication server errors", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Operation failed",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should handle thrown exceptions", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("WebSocket closed"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("WebSocket closed");
    });
  });
});
