import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraStopOrbit } from "../../src/tools/camera-stop-orbit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraOrbitResponse } from "../../src/schemas/index";

describe("camera-stop-orbit tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: () => Promise<{
    structuredContent: CameraOrbitResponse;
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

    registerCameraStopOrbit(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_stop_orbit tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_stop_orbit",
        expect.objectContaining({
          title: "Stop Camera Orbit",
          description: expect.stringContaining("Stop"),
          inputSchema: {},
        }),
        expect.any(Function),
      );
    });

    it("should execute stop-orbit with no parameters", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler();

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_stop_orbit",
        }),
        undefined,
      );

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.orbitActive).toBe(false);
    });

    it("should format success message correctly", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler();

      expect(response.structuredContent.message).toBe("Camera orbit stopped");
    });

    it("should include responseTime in stats", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 10);
          }),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });

    it("should set orbitActive to false on success", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler();

      expect(response.structuredContent.orbitActive).toBe(false);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Connection lost"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection lost");
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "No active orbit to stop",
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "No active orbit to stop",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false and no error message", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler();

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
    });

    it("should set orbitActive to false in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.orbitActive).toBe(false);
    });

    it("should set responseTime to 0 in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle being called when no orbit is active (success case)", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.orbitActive).toBe(false);
    });

    it("should be callable with empty object parameter", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(true);
    });
  });
});
