import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnimationListActive } from "../../src/tools/animation-list-active";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { AnimationListActiveResponse } from "../../src/schemas/index";

describe("animation_list_active tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: () => Promise<{
    structuredContent: AnimationListActiveResponse;
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

    registerAnimationListActive(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register animation_list_active tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "animation_list_active",
        expect.objectContaining({ title: "List Active Animations" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should return empty list when no animations", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        animations: [],
        clockState: { shouldAnimate: false, multiplier: 1 },
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.animations).toHaveLength(0);
      expect(response.structuredContent.stats.totalAnimations).toBe(0);
    });

    it("should map animations from client data", async () => {
      const clientAnim = {
        animationId: "anim-001",
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
      };
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        animations: [clientAnim],
        clockState: { shouldAnimate: true, multiplier: 5 },
      });

      const response = await registeredHandler();

      expect(response.structuredContent.animations).toHaveLength(1);
      expect(response.structuredContent.animations[0].animationId).toBe(
        "anim-001",
      );
      expect(response.structuredContent.animations[0].clockMultiplier).toBe(5);
      expect(response.structuredContent.animations[0].isAnimating).toBe(true);
    });

    it("should include animation IDs in message when animations present", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        animations: [
          {
            animationId: "anim-test",
            startTime: "2024-01-01T00:00:00Z",
            stopTime: "2024-01-01T01:00:00Z",
          },
        ],
        clockState: { shouldAnimate: true, multiplier: 1 },
      });

      const response = await registeredHandler();

      expect(response.structuredContent.message).toContain("anim-test");
    });

    it("should send correct command type", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
        animations: [],
        clockState: { shouldAnimate: false, multiplier: 1 },
      });

      await registeredHandler();

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({ type: "animation_list_active" }),
        expect.any(Number),
      );
    });
  });

  describe("Unhappy paths", () => {
    it("should return error response when client fails", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Client unavailable",
      });

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Timeout"),
      );

      const response = await registeredHandler();

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Timeout");
    });
  });
});
