import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { ImageryAddResponse } from "../../src/schemas/index";
import { registerImageryAdd } from "../../src/tools/imagery-add";

describe("registerImageryAdd", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: ImageryAddResponse;
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

    registerImageryAdd(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  describe("Happy paths", () => {
    it('should register tool with name "imagery_add"', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "imagery_add",
        expect.objectContaining({
          title: "Add Imagery Layer",
          description: expect.stringContaining("imagery layer"),
        }),
        expect.any(Function),
      );
    });

    it("should add imagery layer with URL template provider", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 1,
        totalLayers: 2,
      });

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        name: "Test Layer",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.layerName).toBe("Test Layer");
      expect(response.structuredContent.layerIndex).toBe(1);
      expect(response.structuredContent.providerType).toBe(
        "UrlTemplateImageryProvider",
      );
      expect(response.isError).toBe(false);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        name: "Test Layer",
      });
    });

    it("should add WMS imagery layer with layers and style", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 2,
        totalLayers: 3,
      });

      const response = await registeredHandler({
        type: "WebMapServiceImageryProvider",
        url: "https://example.com/wms",
        layers: "terrain,roads",
        style: "default",
        format: "image/png",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.layerIndex).toBe(2);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        type: "imagery_add",
        providerType: "WebMapServiceImageryProvider",
        layers: "terrain,roads",
        style: "default",
        format: "image/png",
      });
    });

    it("should add imagery layer with alpha and visibility", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 1,
      });

      const response = await registeredHandler({
        type: "OpenStreetMapImageryProvider",
        url: "https://tile.openstreetmap.org/",
        alpha: 0.5,
        show: false,
      });

      expect(response.structuredContent.success).toBe(true);

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        alpha: 0.5,
        show: false,
      });
    });

    it("should add imagery layer with geographic rectangle", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 1,
      });

      const rectangle = { west: -180, south: -90, east: 180, north: 90 };

      await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        rectangle,
      });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({ rectangle });
    });

    it("should add WMTS imagery layer with tileMatrixSetID", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 1,
      });

      await registeredHandler({
        type: "WebMapTileServiceImageryProvider",
        url: "https://example.com/wmts",
        layers: "satellite",
        tileMatrixSetID: "GoogleMapsCompatible",
      });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        providerType: "WebMapTileServiceImageryProvider",
        tileMatrixSetID: "GoogleMapsCompatible",
      });
    });

    it("should add imagery layer with zoom level constraints", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 1,
      });

      await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        minimumLevel: 3,
        maximumLevel: 18,
      });

      const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
      expect(command).toMatchObject({
        minimumLevel: 3,
        maximumLevel: 18,
      });
    });

    it("should use provider type as layer name when name not provided", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 0,
      });

      const response = await registeredHandler({
        type: "IonImageryProvider",
        url: "https://example.com",
      });

      expect(response.structuredContent.layerName).toBe("IonImageryProvider");
    });

    it("should use result layerName when name not provided but result has one", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 0,
        layerName: "Auto-generated Name",
      });

      const response = await registeredHandler({
        type: "IonImageryProvider",
        url: "https://example.com",
      });

      expect(response.structuredContent.layerName).toBe("Auto-generated Name");
    });

    it("should include totalLayers in stats when provided", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: true,
        layerIndex: 3,
        totalLayers: 4,
      });

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
      });

      expect(response.structuredContent.stats.totalLayers).toBe(4);
    });

    it("should include responseTime in stats", async () => {
      mockCommunicationServer.executeCommand.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, layerIndex: 0 }), 10);
          }),
      );

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
      });

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Connection failed"),
      );

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection failed");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
        error: "Invalid provider URL",
      });

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "invalid-url",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Invalid provider URL",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false and no error message", async () => {
      mockCommunicationServer.executeCommand.mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com",
      });

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle timeout error", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Timeout"),
      );

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Timeout");
    });

    it("should include providerType in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({
        type: "ArcGisMapServerImageryProvider",
        url: "https://example.com",
        name: "Failed Layer",
      });

      expect(response.structuredContent.providerType).toBe(
        "ArcGisMapServerImageryProvider",
      );
      expect(response.structuredContent.layerName).toBe("Failed Layer");
    });

    it("should set responseTime to 0 in error response", async () => {
      mockCommunicationServer.executeCommand.mockRejectedValue(
        new Error("Error"),
      );

      const response = await registeredHandler({
        type: "UrlTemplateImageryProvider",
        url: "https://example.com",
      });

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });
});
