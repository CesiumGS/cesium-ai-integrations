import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraSetView } from "../../src/tools/camera-set-view";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraSetViewResponse } from "../../src/schemas/index";
import { DEFAULT_ORIENTATION } from "../../src/utils/constants";

describe("camera-set-view tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: CameraSetViewResponse;
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

    registerCameraSetView(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_set_view tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_set_view",
        expect.objectContaining({
          title: "Set Camera View",
          description: expect.stringContaining("Instantly set camera"),
        }),
        expect.any(Function),
      );
    });

    it("should execute set-view with minimal parameters (only destination)", async () => {
      const destination = { longitude: -105, latitude: 39, height: 1609 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ destination });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_set_view",
          destination,
          orientation: DEFAULT_ORIENTATION,
        }),
        undefined, // No timeout specified for instant operations
      );

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.position).toEqual(destination);
      expect(response.structuredContent.orientation).toEqual(
        DEFAULT_ORIENTATION,
      );
    });

    it("should execute set-view with custom orientation", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };
      const orientation = { heading: 180, pitch: -60, roll: 15 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ destination, orientation });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          orientation,
        }),
        undefined,
      );

      expect(response.structuredContent.orientation).toEqual(orientation);
    });

    it("should include responseTime in stats", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 10);
          }),
      );

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });

    it("should format message with coordinates", async () => {
      const destination = { longitude: -105.5, latitude: 39.8, height: 2000 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.message).toContain("39.8°");
      expect(response.structuredContent.message).toContain("-105.5°");
      expect(response.structuredContent.message).toContain("2000m");
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Network error"),
      );

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Network error");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Cannot set view to this position",
      });

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Cannot set view to this position",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false and no error message", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
      expect(response.isError).toBe(true);
    });

    it("should include destination and orientation in error response", async () => {
      const destination = { longitude: -105, latitude: 39, height: 1609 };
      const orientation = { heading: 90, pitch: -45, roll: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({ destination, orientation });

      expect(response.structuredContent.position).toEqual(destination);
      expect(response.structuredContent.orientation).toEqual(orientation);
    });

    it("should use DEFAULT_ORIENTATION and zero responseTime in error when orientation not provided", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.orientation).toEqual(
        DEFAULT_ORIENTATION,
      );
      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });
});
