import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraFlyTo } from "../../src/tools/camera-fly-to";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraFlyToResponse } from "../../src/schemas/index";
import {
  DEFAULT_ORIENTATION,
  TIMEOUT_BUFFER_MS,
} from "../../src/utils/constants";

describe("camera-fly-to tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: CameraFlyToResponse;
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

    registerCameraFlyTo(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_fly_to tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_fly_to",
        expect.objectContaining({
          title: "Fly Camera To Position",
          description: expect.stringContaining("camera fly operation"),
        }),
        expect.any(Function),
      );
    });

    it("should execute fly-to with minimal parameters (only destination)", async () => {
      const destination = { longitude: -105, latitude: 39, height: 1609 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 3,
      });

      const response = await registeredHandler({ destination });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_fly_to",
          destination,
          orientation: DEFAULT_ORIENTATION,
          duration: 3,
        }),
        5000, // 3000ms duration + 2000ms buffer
      );

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.finalPosition).toEqual(destination);
      expect(response.structuredContent.finalOrientation).toEqual(
        DEFAULT_ORIENTATION,
      );
    });

    it("should execute fly-to with custom orientation", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };
      const orientation = { heading: 90, pitch: -45, roll: 10 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 3,
      });

      const response = await registeredHandler({ destination, orientation });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          orientation,
        }),
        expect.any(Number),
      );

      expect(response.structuredContent.finalOrientation).toEqual(orientation);
    });

    it("should execute fly-to with custom duration and timeout calculation", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };
      const duration = 10;

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 10,
      });

      await registeredHandler({ destination, duration });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 10 }),
        10000 + TIMEOUT_BUFFER_MS, // 10s duration + 2s buffer
      );
    });

    it("should execute fly-to with easing function", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };
      const easingFunction = "CUBIC_IN_OUT";

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 3,
      });

      const response = await registeredHandler({
        destination,
        easingFunction,
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          easingFunction: "CUBIC_IN_OUT",
        }),
        expect.any(Number),
      );

      expect(response.structuredContent.message).toContain(
        "CUBIC_IN_OUT easing",
      );
    });

    it("should execute fly-to with all advanced options", async () => {
      const params = {
        destination: { longitude: -105, latitude: 39, height: 1609 },
        orientation: { heading: 45, pitch: -30, roll: 0 },
        duration: 5,
        easingFunction: "EXPONENTIAL_IN_OUT" as const,
        maximumHeight: 10000,
        pitchAdjustHeight: 500,
        flyOverLongitude: -100,
        flyOverLongitudeWeight: 0.5,
      };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 5,
      });

      const response = await registeredHandler(params);

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_fly_to",
          ...params,
        }),
        7000, // 5000ms + 2000ms buffer
      );

      expect(response.structuredContent.success).toBe(true);
    });

    it("should include actualDuration in response stats when provided", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 3.5,
      });

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.stats.actualDuration).toBe(3.5);
    });

    it("should handle duration of 0", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        actualDuration: 0,
      });

      await registeredHandler({ destination, duration: 0 });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 0 }),
        TIMEOUT_BUFFER_MS, // 0 + buffer
      );
    });

    it("should include responseTime in stats", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, actualDuration: 3 }), 10);
          }),
      );

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Connection failed"),
      );

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection failed");
      expect(response.isError).toBe(true);
      expect(response.structuredContent.stats.responseTime).toBe(0);
    });

    it("should handle result with success=false", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Invalid destination",
      });

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Invalid destination",
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

      expect(response.structuredContent.finalPosition).toEqual(destination);
      expect(response.structuredContent.finalOrientation).toEqual(orientation);
    });

    it("should handle timeout error", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Timeout"),
      );

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Timeout");
    });

    it("should handle malformed result without actualDuration", async () => {
      const destination = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        // missing actualDuration
      });

      const response = await registeredHandler({ destination });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.stats.actualDuration).toBeNull();
    });
  });
});
