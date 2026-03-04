import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerClockControl } from "../../src/tools/clock-control";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { ClockResponse } from "../../src/schemas/index";

describe("clock_control tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: ClockResponse;
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

    registerClockControl(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register clock_control tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "clock_control",
        expect.objectContaining({ title: "Control Animation Clock" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths - configure action", () => {
    it("should send configure command with clock config", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        action: "configure",
        clock: {
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          multiplier: 10,
        },
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "clock_control",
          action: "configure",
          clock: expect.objectContaining({ multiplier: 10 }),
        }),
        expect.any(Number),
      );
    });

    it("should return success response for configure", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        action: "configure",
        clock: { multiplier: 5 },
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("Clock configured");
    });

    it("should include multiplier in configure message", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        action: "configure",
        clock: { multiplier: 100 },
      });

      expect(response.structuredContent.message).toContain("100");
    });
  });

  describe("Happy paths - setTime action", () => {
    it("should send setTime command", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        action: "setTime",
        currentTime: "2024-06-15T12:00:00Z",
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "clock_control",
          action: "setTime",
          currentTime: "2024-06-15T12:00:00Z",
        }),
        expect.any(Number),
      );
    });

    it("should return success response for setTime", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        action: "setTime",
        currentTime: "2024-06-15T12:00:00Z",
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain(
        "2024-06-15T12:00:00Z",
      );
    });
  });

  describe("Happy paths - setMultiplier action", () => {
    it("should send setMultiplier command", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        action: "setMultiplier",
        multiplier: 1000,
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "clock_control",
          action: "setMultiplier",
          multiplier: 1000,
        }),
        expect.any(Number),
      );
    });

    it("should include multiplier value in message", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        action: "setMultiplier",
        multiplier: 500,
      });

      expect(response.structuredContent.message).toContain("500");
    });
  });

  describe("Unhappy paths", () => {
    it("should return error when configure action has no clock", async () => {
      const response = await registeredHandler({
        action: "configure",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when setTime has no currentTime", async () => {
      const response = await registeredHandler({
        action: "setTime",
      });

      expect(response.structuredContent.success).toBe(false);
    });

    it("should return error when setMultiplier has no multiplier", async () => {
      const response = await registeredHandler({
        action: "setMultiplier",
      });

      expect(response.structuredContent.success).toBe(false);
    });

    it("should return error when client fails", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Client error",
      });

      const response = await registeredHandler({
        action: "setMultiplier",
        multiplier: 10,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Timeout"),
      );

      const response = await registeredHandler({
        action: "setMultiplier",
        multiplier: 10,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Timeout");
    });
  });
});
