import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnimationUpdatePath } from "../../src/tools/animation-update-path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { GenericAnimationResponse } from "../../src/schemas/index";

describe("animation_update_path tool", () => {
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

    registerAnimationUpdatePath(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register animation_update_path tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "animation_update_path",
        expect.objectContaining({
          title: "Update Animation Path Visualization",
        }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should send path update command and return correct response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ animationId: "anim-001" });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "animation_update_path",
          animationId: "anim-001",
        }),
        expect.any(Number),
      );
      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain(
        "Path visualization updated",
      );
      expect(response.structuredContent.animationId).toBe("anim-001");
    });

    it("should send path update with all optional fields", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        animationId: "anim-001",
        leadTime: 60,
        trailTime: 120,
        width: 5,
        color: { red: 1, green: 0, blue: 0 },
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          animationId: "anim-001",
          leadTime: 60,
          trailTime: 120,
          width: 5,
        }),
        expect.any(Number),
      );
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

    it("should return error when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Connection lost"),
      );

      const response = await registeredHandler({
        animationId: "anim-001",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Connection lost");
    });
  });
});
