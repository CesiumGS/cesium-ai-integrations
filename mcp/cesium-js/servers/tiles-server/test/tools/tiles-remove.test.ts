import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TilesetRemoveResponse } from "../../src/schemas/index";
import { registerTilesetRemove } from "../../src/tools/tiles-remove";

describe("registerTilesetRemove", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TilesetRemoveResponse;
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

    registerTilesetRemove(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "tileset_remove"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "tileset_remove",
        expect.objectContaining({ title: "Remove 3D Tileset" }),
        expect.any(Function),
      );
    });

    it("should remove tileset by tilesetId", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedTilesetId: "ts-1",
        removedName: "My Tileset",
        removedCount: 1,
      });

      const response = await registeredHandler({ tilesetId: "ts-1" });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.removedTilesetId).toBe("ts-1");
      expect(response.structuredContent.removedCount).toBe(1);
      expect(response.isError).toBe(false);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "tileset_remove",
        tilesetId: "ts-1",
      });
    });

    it("should remove tileset by name", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedTilesetId: "ts-2",
        removedName: "My Tileset",
        removedCount: 1,
      });

      const response = await registeredHandler({ name: "My Tileset" });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.removedName).toBe("My Tileset");
    });

    it("should remove all tilesets", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedCount: 3,
      });

      const response = await registeredHandler({ removeAll: true });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.removedCount).toBe(3);
      expect(response.structuredContent.message).toContain("3 tilesets");
    });

    it("should include responseTime in stats", async () => {
      mockCommunicationServer.executeCommand.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  removedTilesetId: "ts-1",
                  removedCount: 1,
                }),
              10,
            );
          }),
      );

      const response = await registeredHandler({ tilesetId: "ts-1" });
      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });
  });

  describe("Unhappy paths", () => {
    it("should fail when no identifier provided", async () => {
      const response = await registeredHandler({});
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "tilesetId, name, or removeAll",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle communication server error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Connection failed"),
      );

      const response = await registeredHandler({ tilesetId: "ts-1" });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection failed");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Tileset not found",
      });

      const response = await registeredHandler({ tilesetId: "ts-999" });
      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Tileset not found");
      expect(response.isError).toBe(true);
    });

    it("should set responseTime to 0 on error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ tilesetId: "ts-1" });
      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });
});
