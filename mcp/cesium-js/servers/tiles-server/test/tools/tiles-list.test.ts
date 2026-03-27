import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TilesetListResponse } from "../../src/schemas/index";
import { registerTilesetList } from "../../src/tools/tiles-list";

describe("registerTilesetList", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TilesetListResponse;
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

    registerTilesetList(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "tileset_list"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "tileset_list",
        expect.objectContaining({ title: "List 3D Tilesets" }),
        expect.any(Function),
      );
    });

    it("should list tilesets successfully", async () => {
      const mockTilesets = [
        {
          tilesetId: "ts-1",
          name: "Buildings",
          sourceType: "ion",
          show: true,
          assetId: 96188,
        },
      ];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesets: mockTilesets,
        totalCount: 2,
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.tilesets).toHaveLength(1);
      expect(response.structuredContent.totalCount).toBe(1);
      expect(response.structuredContent.message).toContain("1 tileset");
      expect(response.isError).toBe(false);
    });

    it("should return empty list when no tilesets loaded", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesets: [],
        totalCount: 0,
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.tilesets).toHaveLength(0);
      expect(response.structuredContent.totalCount).toBe(0);
      expect(response.structuredContent.message).toContain("0 tilesets");
    });

    it("should use singular form for a single tileset", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesets: [{ tilesetId: "ts-1", sourceType: "url", show: true }],
      });

      const response = await registeredHandler({});
      expect(response.structuredContent.message).toContain("1 tileset");
      expect(response.structuredContent.message).not.toContain("1 tilesets");
    });

    it("should pass includeDetails to the command", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesets: [],
      });

      await registeredHandler({ includeDetails: true });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "tileset_list",
        includeDetails: true,
      });
    });

    it("should default includeDetails to false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesets: [],
      });

      await registeredHandler({});

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command.includeDetails).toBe(false);
    });

    it("should include responseTime in stats", async () => {
      mockCommunicationServer.executeCommand.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, tilesets: [] }), 10);
          }),
      );

      const response = await registeredHandler({});
      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });

    it("should handle non-array tilesets gracefully", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesets: null,
      });

      const response = await registeredHandler({});
      expect(response.structuredContent.tilesets).toEqual([]);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Connection failed"),
      );

      const response = await registeredHandler({});
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection failed");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Scene not available",
      });

      const response = await registeredHandler({});
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.tilesets).toEqual([]);
      expect(response.structuredContent.totalCount).toBe(0);
      expect(response.isError).toBe(true);
    });

    it("should set responseTime to 0 on error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({});
      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });
});
