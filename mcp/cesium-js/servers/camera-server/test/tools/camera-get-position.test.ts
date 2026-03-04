import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraGetPosition } from "../../src/tools/camera-get-position";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraGetPositionResponse } from "../../src/schemas/index";

describe("camera-get-position tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: () => Promise<{
    structuredContent: CameraGetPositionResponse;
    isError: boolean;
  }>;

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn((name, config, handler) => {
        registeredHandler = handler;
      }),
    } as unknown as McpServer;

    mockCommunicationServer = {
      executeCommand: vi.fn(),
    } as unknown as ICommunicationServer;

    registerCameraGetPosition(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_get_position tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_get_position",
        expect.objectContaining({
          title: "Get Camera Position",
          description: expect.stringContaining(
            "comprehensive camera information",
          ),
          inputSchema: {},
        }),
        expect.any(Function),
      );
    });

    it("should execute get-position and return full camera information", async () => {
      const mockResult = {
        success: true,
        position: { longitude: -105.5, latitude: 39.8, height: 1609 },
        orientation: { heading: 90, pitch: -45, roll: 0 },
        viewRectangle: { west: -106, south: 39, east: -105, north: 40 },
        altitude: 1609,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue(
        mockResult,
      );

      const response = await registeredHandler();

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_get_position",
        }),
        undefined,
      );

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.position).toEqual(mockResult.position);
      expect(response.structuredContent.orientation).toEqual(
        mockResult.orientation,
      );
      expect(response.structuredContent.viewRectangle).toEqual(
        mockResult.viewRectangle,
      );
      expect(response.structuredContent.altitude).toBe(1609);
    });

    it("should format message with coordinates and altitude", async () => {
      const mockResult = {
        success: true,
        position: { longitude: -105.5678, latitude: 39.8234, height: 1609.5 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue(
        mockResult,
      );

      const response = await registeredHandler();

      expect(response.structuredContent.message).toContain("39.8234°");
      expect(response.structuredContent.message).toContain("-105.5678°");
      expect(response.structuredContent.message).toContain("1610m"); // Rounded
    });

    it("should handle missing viewRectangle", async () => {
      const mockResult = {
        success: true,
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue(
        mockResult,
      );

      const response = await registeredHandler();

      expect(response.structuredContent.viewRectangle).toBeNull();
    });

    it("should use position.height as altitude if altitude not provided", async () => {
      const mockResult = {
        success: true,
        position: { longitude: 0, latitude: 0, height: 2500 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue(
        mockResult,
      );

      const response = await registeredHandler();

      expect(response.structuredContent.altitude).toBe(2500);
    });

    it("should prefer explicit altitude over position.height", async () => {
      const mockResult = {
        success: true,
        position: { longitude: 0, latitude: 0, height: 1000 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
        altitude: 1500,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue(
        mockResult,
      );

      const response = await registeredHandler();

      expect(response.structuredContent.altitude).toBe(1500);
    });

    it("should include timestamp in ISO format", async () => {
      const mockResult = {
        success: true,
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue(
        mockResult,
      );

      const response = await registeredHandler();

      expect(response.structuredContent.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("should include responseTime in stats", async () => {
      const mockResult = {
        success: true,
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResult), 10);
          }),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Failed to query position"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Failed to query position",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Camera not initialized",
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Camera not initialized",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result missing position", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        orientation: { heading: 0, pitch: 0, roll: 0 },
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Failed to get camera position",
      );
    });

    it("should handle result missing orientation", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        position: { longitude: 0, latitude: 0, height: 0 },
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
    });

    it("should provide default values in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.position).toEqual({
        longitude: 0,
        latitude: 0,
        height: 0,
      });
      expect(response.structuredContent.orientation).toEqual({
        heading: 0,
        pitch: 0,
        roll: 0,
      });
      expect(response.structuredContent.viewRectangle).toBeNull();
      expect(response.structuredContent.altitude).toBe(0);
    });

    it("should set responseTime to 0 in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });

    it("should include valid timestamp even in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
