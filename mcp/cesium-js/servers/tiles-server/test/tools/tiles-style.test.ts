import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { TilesetStyleResponse } from "../../src/schemas/index";
import { registerTilesetStyle } from "../../src/tools/tiles-style";

describe("registerTilesetStyle", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: TilesetStyleResponse;
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

    registerTilesetStyle(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "tileset_style"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "tileset_style",
        expect.objectContaining({
          title: "Style 3D Tileset",
          description: expect.stringContaining("3D Tiles styling"),
        }),
        expect.any(Function),
      );
    });

    it("should apply a solid color style by tilesetId", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-1",
        name: "Buildings",
        appliedStyle: { color: "color('red')" },
      });

      const response = await registeredHandler({
        tilesetId: "ts-1",
        color: "color('red')",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.tilesetId).toBe("ts-1");
      expect(response.structuredContent.appliedStyle?.color).toBe(
        "color('red')",
      );
      expect(response.isError).toBe(false);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "tileset_style",
        tilesetId: "ts-1",
        color: "color('red')",
      });
    });

    it("should apply color conditions by name", async () => {
      const conditions: [string, string][] = [
        ["${height} >= 100", "color('blue')"],
        ["true", "color('white')"],
      ];
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-2",
        name: "Buildings",
        appliedStyle: { colorConditions: conditions },
      });

      const response = await registeredHandler({
        name: "Buildings",
        colorConditions: conditions,
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.appliedStyle?.colorConditions).toEqual(
        conditions,
      );

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "tileset_style",
        name: "Buildings",
        colorConditions: conditions,
      });
    });

    it("should apply boolean show condition", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-1",
        name: "Buildings",
        appliedStyle: { show: false },
      });

      const response = await registeredHandler({
        tilesetId: "ts-1",
        show: false,
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.appliedStyle?.show).toBe(false);
    });

    it("should apply string show expression", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-1",
        name: "Buildings",
        appliedStyle: { show: "${height} > 10" },
      });

      const response = await registeredHandler({
        tilesetId: "ts-1",
        show: "${height} > 10",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.appliedStyle?.show).toBe(
        "${height} > 10",
      );
    });

    it("should apply combined color and show style", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        tilesetId: "ts-3",
        name: "Terrain",
        appliedStyle: { color: "color('green')", show: true },
      });

      const response = await registeredHandler({
        tilesetId: "ts-3",
        color: "color('green')",
        show: true,
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.appliedStyle?.color).toBe(
        "color('green')",
      );
      expect(response.structuredContent.appliedStyle?.show).toBe(true);
    });
  });

  describe("Error paths", () => {
    it("should fail when neither tilesetId nor name is provided", async () => {
      const response = await registeredHandler({
        color: "color('red')",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Either tilesetId or name must be provided",
      );
      expect(response.isError).toBe(true);
    });

    it("should fail when no style properties are provided", async () => {
      const response = await registeredHandler({
        tilesetId: "ts-1",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "At least one style property",
      );
      expect(response.isError).toBe(true);
    });

    it("should fail when tileset is not found", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "No tileset found with id 'ts-99'",
      });

      const response = await registeredHandler({
        tilesetId: "ts-99",
        color: "color('red')",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("ts-99");
      expect(response.isError).toBe(true);
    });

    it("should handle communication server errors gracefully", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Connection lost"),
      );

      const response = await registeredHandler({
        tilesetId: "ts-1",
        color: "color('red')",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection lost");
      expect(response.isError).toBe(true);
    });
  });
});
