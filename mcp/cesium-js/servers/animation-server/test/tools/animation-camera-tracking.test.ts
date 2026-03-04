import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnimationCameraTracking } from "../../src/tools/animation-camera-tracking";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraTrackingResponse } from "../../src/schemas/index";

describe("animation_camera_tracking tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: CameraTrackingResponse;
    isError: boolean;
  }>;

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn((_name, _config, handler) => {
        registeredHandler = handler;
      }),
    } as unknown as McpServer;

    mockCommunicationServer = {
      executeCommand: vi.fn(),
    } as unknown as ICommunicationServer;

    registerAnimationCameraTracking(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register animation_camera_tracking tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "animation_camera_tracking",
        expect.objectContaining({ title: "Control Camera Tracking" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths - tracking enabled", () => {
    it("should send track command with defaults", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        track: true,
        animationId: "anim-001",
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "animation_camera_tracking",
          animationId: "anim-001",
          track: true,
          range: 1000,
          pitch: -45,
          heading: 0,
        }),
        expect.any(Number),
      );
      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.isTracking).toBe(true);
      expect(response.structuredContent.trackedAnimationId).toBe("anim-001");
    });

    it("should send track command with custom range and pitch", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        track: true,
        animationId: "anim-002",
        range: 500,
        pitch: -30,
        heading: 45,
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({ range: 500, pitch: -30, heading: 45 }),
        expect.any(Number),
      );
    });

    it("should return isTracking=true when tracking", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        track: true,
        animationId: "anim-001",
      });

      expect(response.structuredContent.isTracking).toBe(true);
      expect(response.structuredContent.message).toContain("anim-001");
    });
  });

  describe("Happy paths - tracking disabled", () => {
    it("should send stop-tracking command", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        track: false,
        animationId: "anim-001",
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "animation_camera_tracking",
          track: false,
          animationId: "anim-001",
        }),
        expect.any(Number),
      );
      expect(response.structuredContent.isTracking).toBe(false);
    });
  });

  describe("Unhappy paths", () => {
    it("should return error when animationId is missing", async () => {
      const response = await registeredHandler({
        track: true,
        animationId: undefined,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when client fails", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Entity not found",
      });

      const response = await registeredHandler({
        track: true,
        animationId: "anim-999",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Timeout"),
      );

      const response = await registeredHandler({
        track: true,
        animationId: "anim-001",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Timeout");
    });
  });
});
