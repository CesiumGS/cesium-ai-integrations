import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraSetControllerOptions } from "../../src/tools/camera-set-controller-options";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraControllerOptionsResponse } from "../../src/schemas/index";

describe("camera-set-controller-options tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: CameraControllerOptionsResponse;
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

    registerCameraSetControllerOptions(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_set_controller_options tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_set_controller_options",
        expect.objectContaining({
          title: "Set Camera Controller Options",
          description: expect.stringContaining("camera movement constraints"),
        }),
        expect.any(Function),
      );
    });

    it("should execute with empty options", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        settings: {},
      });

      const response = await registeredHandler({});

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_set_controller_options",
          options: {
            enableCollisionDetection: undefined,
            minimumZoomDistance: undefined,
            maximumZoomDistance: undefined,
            enableTilt: undefined,
            enableRotate: undefined,
            enableTranslate: undefined,
            enableZoom: undefined,
            enableLook: undefined,
          },
        }),
        undefined,
      );

      expect(response.structuredContent.success).toBe(true);
    });

    it("should execute with all options provided", async () => {
      const options = {
        enableCollisionDetection: true,
        minimumZoomDistance: 10,
        maximumZoomDistance: 50000,
        enableTilt: true,
        enableRotate: true,
        enableTranslate: true,
        enableZoom: true,
        enableLook: true,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler(options);

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_set_controller_options",
          options,
        }),
        undefined,
      );

      expect(response.structuredContent.settings).toEqual(options);
    });

    it("should execute with partial options", async () => {
      const options = {
        enableCollisionDetection: false,
        minimumZoomDistance: 100,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler(options);

      expect(response.structuredContent.settings.enableCollisionDetection).toBe(
        false,
      );
      expect(response.structuredContent.settings.minimumZoomDistance).toBe(100);
      expect(
        response.structuredContent.settings.maximumZoomDistance,
      ).toBeNull();
    });

    it("should handle boolean flags correctly", async () => {
      const options = {
        enableTilt: false,
        enableRotate: false,
        enableTranslate: false,
        enableZoom: false,
        enableLook: false,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler(options);

      expect(response.structuredContent.settings.enableTilt).toBe(false);
      expect(response.structuredContent.settings.enableRotate).toBe(false);
      expect(response.structuredContent.settings.enableTranslate).toBe(false);
      expect(response.structuredContent.settings.enableZoom).toBe(false);
      expect(response.structuredContent.settings.enableLook).toBe(false);
    });

    it("should handle zoom distance constraints", async () => {
      const options = {
        minimumZoomDistance: 0,
        maximumZoomDistance: 1000000,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler(options);

      expect(response.structuredContent.settings.minimumZoomDistance).toBe(0);
      expect(response.structuredContent.settings.maximumZoomDistance).toBe(
        1000000,
      );
    });

    it("should format success message correctly", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        settings: {},
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.message).toBe(
        "Camera controller options updated",
      );
    });

    it("should set undefined options to null in response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        settings: { enableCollisionDetection: true },
      });

      const response = await registeredHandler({
        enableCollisionDetection: true,
      });

      expect(
        response.structuredContent.settings.minimumZoomDistance,
      ).toBeNull();
      expect(
        response.structuredContent.settings.maximumZoomDistance,
      ).toBeNull();
      expect(response.structuredContent.settings.enableTilt).toBeNull();
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Configuration failed"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Configuration failed",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Invalid options",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Invalid options");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false and no error message", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
    });

    it("should use default values in error response for undefined options", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.settings.enableCollisionDetection).toBe(
        true,
      );
      expect(response.structuredContent.settings.enableTilt).toBe(true);
      expect(response.structuredContent.settings.enableRotate).toBe(true);
      expect(response.structuredContent.settings.enableTranslate).toBe(true);
      expect(response.structuredContent.settings.enableZoom).toBe(true);
      expect(response.structuredContent.settings.enableLook).toBe(true);
      expect(
        response.structuredContent.settings.minimumZoomDistance,
      ).toBeNull();
      expect(
        response.structuredContent.settings.maximumZoomDistance,
      ).toBeNull();
    });

    it("should preserve provided values in error response", async () => {
      const options = {
        enableCollisionDetection: false,
        minimumZoomDistance: 500,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler(options);

      expect(response.structuredContent.settings.enableCollisionDetection).toBe(
        false,
      );
      expect(response.structuredContent.settings.minimumZoomDistance).toBe(500);
    });

    it("should set responseTime to 0 in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle enableCollisionDetection as false explicitly", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        enableCollisionDetection: false,
      });

      expect(response.structuredContent.settings.enableCollisionDetection).toBe(
        false,
      );
    });

    it("should handle minimumZoomDistance of 0", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ minimumZoomDistance: 0 });

      expect(response.structuredContent.settings.minimumZoomDistance).toBe(0);
    });

    it("should handle maximumZoomDistance of 0", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ maximumZoomDistance: 0 });

      expect(response.structuredContent.settings.maximumZoomDistance).toBe(0);
    });

    it("should handle all boolean flags as false", async () => {
      const options = {
        enableCollisionDetection: false,
        enableTilt: false,
        enableRotate: false,
        enableTranslate: false,
        enableZoom: false,
        enableLook: false,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler(options);

      Object.entries(options).forEach(([key, value]) => {
        expect(response.structuredContent.settings[key]).toBe(value);
      });
    });
  });
});
