import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnimationRemove } from "../../src/tools/animation-remove";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { GenericAnimationResponse } from "../../src/schemas/index";

describe("animation_remove tool", () => {
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

    registerAnimationRemove(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register animation_remove tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "animation_remove",
        expect.objectContaining({ title: "Remove Animation" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should send remove command and return correct response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ animationId: "anim-001" });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "animation_remove",
          animationId: "anim-001",
        }),
        expect.any(Number),
      );
      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("anim-001");
      expect(response.isError).toBe(false);
    });

    it("should return animationId in structured content", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        animationId: "anim-42",
      });

      expect(response.structuredContent.animationId).toBe("anim-42");
    });
  });

  describe("Unhappy paths", () => {
    it("should return error response when client fails", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Animation not found",
      });

      const response = await registeredHandler({
        animationId: "anim-999",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error response when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Network error"),
      );

      const response = await registeredHandler({
        animationId: "anim-001",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Network error");
    });
  });
});
