import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { ImageryListResponse } from "../../src/schemas/index";
import { registerImageryList } from "../../src/tools/imagery-list";

describe("registerImageryList", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    structuredContent: ImageryListResponse;
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

    registerImageryList(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "imagery_list"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "imagery_list",
        expect.objectContaining({
          title: "List Imagery Layers",
        }),
        expect.any(Function),
      );
    });

    it("should list imagery layers with empty result", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers: [],
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.layers).toEqual([]);
      expect(response.structuredContent.totalCount).toBe(0);
      expect(response.structuredContent.message).toContain("0");
    });

    it("should list imagery layers with multiple results", async () => {
      const layers = [
        {
          index: 0,
          name: "Base",
          show: true,
          alpha: 1,
          providerType: "IonImageryProvider",
        },
        {
          index: 1,
          name: "Satellite",
          show: true,
          alpha: 0.8,
          providerType: "UrlTemplateImageryProvider",
          url: "https://example.com",
        },
        {
          index: 2,
          name: "Overlay",
          show: false,
          alpha: 0.5,
          providerType: "WebMapServiceImageryProvider",
        },
      ];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers,
      });

      const response = await registeredHandler({ includeDetails: true });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.layers).toEqual(layers);
      expect(response.structuredContent.totalCount).toBe(3);
      expect(response.structuredContent.message).toContain("3");

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "imagery_list",
        includeDetails: true,
      });
    });

    it("should include summary text with layer details", async () => {
      const layers = [
        {
          index: 0,
          name: "Base Layer",
          show: true,
          alpha: 1,
          providerType: "IonImageryProvider",
        },
      ];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers,
      });

      const response = await registeredHandler({ includeDetails: true });

      expect(response.content[0].text).toContain("Base Layer");
      expect(response.content[0].text).toContain("visible");
      expect(response.content[0].text).toContain("IonImageryProvider");
    });

    it("should show hidden status for non-visible layers", async () => {
      const layers = [
        { index: 0, name: "Hidden Layer", show: false, alpha: 0.5 },
      ];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers,
      });

      const response = await registeredHandler({});

      expect(response.content[0].text).toContain("hidden");
    });

    it("should use layer index as fallback name", async () => {
      const layers = [{ index: 0, show: true, alpha: 1 }];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers,
      });

      const response = await registeredHandler({});

      expect(response.content[0].text).toContain("Layer 0");
    });

    it("should default includeDetails to false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers: [],
      });

      await registeredHandler({});

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({ includeDetails: false });
    });

    it("should not show provider type when includeDetails is false", async () => {
      const layers = [
        {
          index: 0,
          name: "Test",
          show: true,
          alpha: 1,
          providerType: "IonImageryProvider",
        },
      ];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers,
      });

      const response = await registeredHandler({});

      expect(response.content[0].text).not.toContain("IonImageryProvider");
    });

    it("should handle singular layer message", async () => {
      const layers = [{ index: 0, name: "Only", show: true, alpha: 1 }];

      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layers,
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.message).toContain("1 imagery layer");
      expect(response.structuredContent.message).not.toContain("layers");
    });

    it("should include responseTime in stats", async () => {
      mockCommunicationServer.executeCommand.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, layers: [] }), 10);
          }),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });

    it("should handle missing layers array in result", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.layers).toEqual([]);
      expect(response.structuredContent.totalCount).toBe(0);
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
    });

    it("should handle result with success=false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Scene not initialized",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Scene not initialized",
      );
    });

    it("should handle result with success=false and no error message", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
    });

    it("should return empty layers array in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.layers).toEqual([]);
      expect(response.structuredContent.totalCount).toBe(0);
    });

    it("should set responseTime to 0 in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });
});
