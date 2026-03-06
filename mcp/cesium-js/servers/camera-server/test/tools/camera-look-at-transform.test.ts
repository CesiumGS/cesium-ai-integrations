import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraLookAtTransform } from "../../src/tools/camera-look-at-transform";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraLookAtTransformResponse } from "../../src/schemas/index";
import { DEFAULT_LOOK_AT_OFFSET } from "../../src/utils/constants";

describe("camera-look-at-transform tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: CameraLookAtTransformResponse;
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

    registerCameraLookAtTransform(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_look_at_transform tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_look_at_transform",
        expect.objectContaining({
          title: "Look At Transform",
          description: expect.stringContaining("Lock the camera"),
        }),
        expect.any(Function),
      );
    });

    it("should execute look-at-transform with minimal parameters (only target)", async () => {
      const target = { longitude: -105, latitude: 39, height: 1609 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ target });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_look_at_transform",
          target,
          offset: DEFAULT_LOOK_AT_OFFSET,
        }),
        undefined,
      );

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.target).toEqual(target);
      expect(response.structuredContent.offset).toEqual(DEFAULT_LOOK_AT_OFFSET);
    });

    it("should execute look-at-transform with custom offset", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };
      const offset = { heading: 45, pitch: -30, range: 5000 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ target, offset });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          offset,
        }),
        undefined,
      );

      expect(response.structuredContent.offset).toEqual(offset);
    });

    it("should format message with target coordinates and range", async () => {
      const target = { longitude: -105.5, latitude: 39.8, height: 1609 };
      const offset = { heading: 0, pitch: -90, range: 2500 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ target, offset });

      expect(response.structuredContent.message).toContain("39.8°");
      expect(response.structuredContent.message).toContain("-105.5°");
      expect(response.structuredContent.message).toContain("2500m");
    });

    it("should accept offset with range of 0", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };
      const offset = { heading: 0, pitch: 0, range: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ target, offset });

      expect(response.structuredContent.offset.range).toBe(0);
    });

    it("should include responseTime in stats", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 10);
          }),
      );

      const response = await registeredHandler({ target });

      expect(response.structuredContent.stats.responseTime).toBeGreaterThan(0);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Communication failed"),
      );

      const response = await registeredHandler({ target });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Communication failed",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Invalid target position",
      });

      const response = await registeredHandler({ target });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Invalid target position",
      );
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false and no error message", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
      });

      const response = await registeredHandler({ target });

      expect(response.structuredContent.message).toContain(
        "Unknown error from Cesium",
      );
    });

    it("should use DEFAULT_LOOK_AT_OFFSET and zero responseTime in error when offset not provided", async () => {
      const target = { longitude: -105, latitude: 39, height: 1609 };
      const offset = { heading: 90, pitch: -45, range: 3000 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({ target, offset });

      expect(response.structuredContent.target).toEqual(target);
      expect(response.structuredContent.offset).toEqual(offset);
    });

    it("should use DEFAULT_LOOK_AT_OFFSET in error when offset not provided", async () => {
      const target = { longitude: 0, latitude: 0, height: 0 };

      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({ target });

      expect(response.structuredContent.offset).toEqual(DEFAULT_LOOK_AT_OFFSET);
      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });
});
