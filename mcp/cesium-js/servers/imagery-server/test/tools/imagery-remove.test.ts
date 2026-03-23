import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { ImageryRemoveResponse } from "../../src/schemas/index";
import { registerImageryRemove } from "../../src/tools/imagery-remove";

describe("registerImageryRemove", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: ImageryRemoveResponse;
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

    registerImageryRemove(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "imagery_remove"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "imagery_remove",
        expect.objectContaining({
          title: "Remove Imagery Layer",
        }),
        expect.any(Function),
      );
    });

    it("should remove imagery layer by index", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedIndex: 2,
        removedCount: 1,
      });

      const response = await registeredHandler({ index: 2 });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("index 2");
      expect(response.structuredContent.removedIndex).toBe(2);
      expect(response.structuredContent.removedCount).toBe(1);
      expect(response.isError).toBe(false);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "imagery_remove",
        index: 2,
      });
    });

    it("should remove imagery layer by name", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedName: "Satellite",
        removedCount: 1,
      });

      const response = await registeredHandler({ name: "Satellite" });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("Satellite");
      expect(response.structuredContent.removedName).toBe("Satellite");
    });

    it("should remove all non-base imagery layers", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedCount: 3,
      });

      const response = await registeredHandler({ removeAll: true });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("3");
      expect(response.structuredContent.message).toContain("layers");
      expect(response.structuredContent.removedCount).toBe(3);
    });

    it("should handle removing single layer with removeAll", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedCount: 1,
      });

      const response = await registeredHandler({ removeAll: true });

      expect(response.structuredContent.message).toContain("1");
      expect(response.structuredContent.message).toContain("layer");
      // Should not contain "layers" (plural) for count 1
      expect(response.structuredContent.message).not.toMatch(/\blayers\b/);
    });

    it("should report 0 removed when removeAll on empty collection", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedCount: 0,
      });

      const response = await registeredHandler({ removeAll: true });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.removedCount).toBe(0);
      expect(response.structuredContent.message).toContain("0");
    });

    it("should use result removedIndex when available", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedIndex: 5,
        removedCount: 1,
      });

      const response = await registeredHandler({ index: 5 });

      expect(response.structuredContent.removedIndex).toBe(5);
    });

    it("should default removeAll to false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        removedCount: 1,
      });

      await registeredHandler({ index: 0 });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({ removeAll: false });
    });
  });

  describe("Unhappy paths", () => {
    it("should throw error when neither index, name, nor removeAll is provided", async () => {
      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "index, name, or removeAll",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle communication server error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Connection failed"),
      );

      const response = await registeredHandler({ index: 1 });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection failed");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Layer not found",
      });

      const response = await registeredHandler({ index: 99 });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Layer not found");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false and no error message", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler({ name: "Missing" });

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
      expect(response.isError).toBe(true);
    });

    it("should include identifier in error response for index", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ index: 3 });

      expect(response.structuredContent.message).toContain("index 3");
      expect(response.structuredContent.removedIndex).toBe(3);
    });

    it("should include identifier in error response for name", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ name: "TestLayer" });

      expect(response.structuredContent.message).toContain("TestLayer");
      expect(response.structuredContent.removedName).toBe("TestLayer");
    });

    it("should set responseTime to 0 in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ index: 0 });

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });

    it("should set removedCount to 0 in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({ index: 0 });

      expect(response.structuredContent.removedCount).toBe(0);
    });
  });
});
