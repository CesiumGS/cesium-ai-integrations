import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnimationControl } from "../../src/tools/animation-control";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { GenericAnimationResponse } from "../../src/schemas/index";

describe("animation_control tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: GenericAnimationResponse;
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

    registerAnimationControl(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register animation_control tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "animation_control",
        expect.objectContaining({ title: "Control Animation Playback" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should send play command and return correct response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        animationId: "anim-001",
        action: "play",
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "animation_control",
          action: "play",
          animationId: "anim-001",
        }),
        expect.any(Number),
      );
      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.animationId).toBe("anim-001");
      expect(response.structuredContent.message).toContain("playback started");
    });

    it("should send pause command and return correct response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        animationId: "anim-001",
        action: "pause",
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "animation_control",
          action: "pause",
          animationId: "anim-001",
        }),
        expect.any(Number),
      );
      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.animationId).toBe("anim-001");
      expect(response.structuredContent.message).toContain("paused");
    });
  });

  describe("Unhappy paths", () => {
    it("should return error response when client returns failure", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Animation not found",
      });

      const response = await registeredHandler({
        animationId: "anim-999",
        action: "play",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error response when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Connection timeout"),
      );

      const response = await registeredHandler({
        animationId: "anim-001",
        action: "play",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Connection timeout",
      );
      expect(response.isError).toBe(true);
    });
  });
});
