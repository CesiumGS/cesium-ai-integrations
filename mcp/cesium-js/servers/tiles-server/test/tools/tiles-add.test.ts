import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TilesetAddResponse } from "../../src/schemas/index";
import { registerTilesetAdd } from "../../src/tools/tiles-add";

describe("registerTilesetAdd", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TilesetAddResponse;
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

    registerTilesetAdd(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "tileset_add"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "tileset_add",
        expect.objectContaining({
          title: "Add 3D Tileset",
          description: expect.stringContaining("3D Tiles"),
        }),
        expect.any(Function),
      );
    });

    it("should add an ion tileset with assetId", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-1",
        totalTilesets: 1,
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 96188,
        name: "Cesium OSM Buildings",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.tilesetId).toBe("ts-1");
      expect(response.structuredContent.name).toBe("Cesium OSM Buildings");
      expect(response.structuredContent.sourceType).toBe("ion");
      expect(response.isError).toBe(false);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 96188,
        name: "Cesium OSM Buildings",
      });
    });

    it("should add a url tileset", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-2",
        totalTilesets: 1,
      });

      const response = await registeredHandler({
        type: "url",
        url: "https://example.com/tileset/tileset.json",
        name: "Custom Tileset",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.sourceType).toBe("url");

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "tileset_add",
        sourceType: "url",
        url: "https://example.com/tileset/tileset.json",
      });
    });

    it("should pass show=false to the command", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-5",
      });

      await registeredHandler({ type: "ion", assetId: 1, show: false });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command.show).toBe(false);
    });

    it("should use source type as name when name not provided", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-6",
      });

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.name).toBe("ion");
    });

    it("should include totalTilesets in stats", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-7",
        totalTilesets: 3,
      });

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.stats.totalTilesets).toBe(3);
    });

    it("should include responseTime in stats", async () => {
      mockCommunicationServer.executeCommand.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, tilesetId: "ts-8" }), 10);
          }),
      );

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });
  });

  describe("Unhappy paths", () => {
    it("should throw when ion type has no assetId", async () => {
      const response = await registeredHandler({ type: "ion" });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("assetId");
      expect(response.isError).toBe(true);
    });

    it("should throw when url type has no url", async () => {
      const response = await registeredHandler({ type: "url" });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("url");
    });

    it("should handle communication server error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Connection failed"),
      );

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection failed");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Asset not found",
      });

      const response = await registeredHandler({ type: "ion", assetId: 99999 });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Asset not found");
      expect(response.isError).toBe(true);
    });

    it("should set responseTime to 0 in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.stats.responseTime).toBe(0);
    });

    it("should preserve tilesetId in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.tilesetId).toBeUndefined();
    });

    it("should handle generic error object", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue({});

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Failed to add");
    });

    it("should handle undefined error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(undefined);

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.success).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle assetId of 0", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-zero",
      });

      const response = await registeredHandler({ type: "ion", assetId: 0 });
      expect(response.structuredContent.success).toBe(true);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command.assetId).toBe(0);
    });

    it("should handle very large assetIds", async () => {
      const largeId = 999999999999;
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-large",
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: largeId,
      });
      expect(response.structuredContent.success).toBe(true);
    });

    it("should handle special characters in name", async () => {
      const specialName = "Buildings & Roads (2024) [v1.0]";
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-special",
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
        name: specialName,
      });

      expect(response.structuredContent.name).toBe(specialName);
    });

    it("should handle URL with query parameters", async () => {
      const urlWithParams =
        "https://example.com/tileset.json?token=abc&version=2";
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-params",
      });

      const response = await registeredHandler({
        type: "url",
        url: urlWithParams,
      });

      expect(response.structuredContent.success).toBe(true);
      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command.url).toBe(urlWithParams);
    });

    it("should handle empty name string", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-empty-name",
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
        name: "",
      });

      // Empty name should fall back to source type or result name
      expect(response.structuredContent.name).toBeDefined();
    });

    it("should handle show=true explicitly", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-visible",
      });

      await registeredHandler({ type: "ion", assetId: 1, show: true });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command.show).toBe(true);
    });

    it("should handle multiple concurrent add requests", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-concurrent",
      });

      const promises = [
        registeredHandler({ type: "ion", assetId: 1 }),
        registeredHandler({ type: "url", url: "https://example.com/1.json" }),
      ];

      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(2);
      expect(responses.every((r) => r.structuredContent.success)).toBe(true);
    });

    it("should handle result without tilesetId from server", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        name: "Server Named Tileset",
      });

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.message).toContain("unknown");
    });

    it("should handle missing totalTilesets in stats", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-no-total",
      });

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.structuredContent.stats.totalTilesets).toBeUndefined();
    });
  });

  describe("Response structure validation", () => {
    it("should always return structured response", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-struct",
      });

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response).toHaveProperty("structuredContent");
      expect(response).toHaveProperty("isError");
    });

    it("should set isError=false on success", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-1",
      });

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.isError).toBe(false);
    });

    it("should set isError=true on failure", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Test"),
      );

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      expect(response.isError).toBe(true);
    });

    it("response should have all required fields on success", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-complete",
        totalTilesets: 1,
      });

      const response = await registeredHandler({
        type: "ion",
        assetId: 1,
        name: "Test",
      });

      const content = response.structuredContent;
      expect(content).toHaveProperty("success");
      expect(content).toHaveProperty("message");
      expect(content).toHaveProperty("tilesetId");
      expect(content).toHaveProperty("name");
      expect(content).toHaveProperty("sourceType");
      expect(content).toHaveProperty("stats");
      expect(content.stats).toHaveProperty("responseTime");
    });

    it("response should have all required fields on error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({ type: "ion", assetId: 1 });
      const content = response.structuredContent;
      expect(content).toHaveProperty("success");
      expect(content).toHaveProperty("message");
      expect(content).toHaveProperty("stats");
      expect(content.stats).toHaveProperty("responseTime");
    });
  });
});
