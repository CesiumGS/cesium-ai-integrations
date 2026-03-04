import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCameraStartOrbit } from "../../src/tools/camera-start-orbit";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { CameraOrbitResponse } from "../../src/schemas/index";
import { DEFAULT_ORBIT_SPEED } from "../../src/utils/constants";

describe("camera-start-orbit tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
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

    registerCameraStartOrbit(mockServer, mockCommunicationServer);
  });

  describe("Happy paths", () => {
    it("should register camera_start_orbit tool with correct configuration", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "camera_start_orbit",
        expect.objectContaining({
          title: "Start Camera Orbit",
          description: expect.stringContaining("orbiting"),
        }),
        expect.any(Function),
      );
    });

    it("should execute start-orbit with default parameters", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({});

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "camera_start_orbit",
          speed: DEFAULT_ORBIT_SPEED, // counterclockwise default = positive
        }),
        undefined,
      );

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.orbitActive).toBe(true);
      expect(response.structuredContent.speed).toBe(DEFAULT_ORBIT_SPEED);
      expect(response.structuredContent.direction).toBe("counterclockwise");
    });

    it("should convert counterclockwise direction to positive speed", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({ speed: 0.01, direction: "counterclockwise" });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: 0.01, // positive for counterclockwise
        }),
        undefined,
      );
    });

    it("should convert clockwise direction to negative speed", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({ speed: 0.01, direction: "clockwise" });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: -0.01, // negative for clockwise
        }),
        undefined,
      );
    });

    it("should handle negative speed input with counterclockwise", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({ speed: -0.01, direction: "counterclockwise" });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: 0.01, // Make absolute then positive for counterclockwise
        }),
        undefined,
      );
    });

    it("should handle negative speed input with clockwise", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({ speed: -0.01, direction: "clockwise" });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: -0.01, // Make absolute then negative for clockwise
        }),
        undefined,
      );
    });

    it("should format message with direction and speed", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        speed: 0.008,
        direction: "clockwise",
      });

      expect(response.structuredContent.message).toContain("clockwise");
      expect(response.structuredContent.message).toContain("0.008");
    });

    it("should accept zero speed", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ speed: 0 });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: 0,
        }),
        undefined,
      );

      expect(response.structuredContent.speed).toBe(0);
    });

    it("should accept large speed values", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({ speed: 1.5 });

      expect(response.structuredContent.speed).toBe(1.5);
    });
  });

  describe("Unhappy paths", () => {
    it("should handle communication server error", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Orbit start failed"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Orbit start failed",
      );
      expect(response.structuredContent.orbitActive).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should handle result with success=false", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "No look-at target set",
      });

      const response = await registeredHandler({});

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "No look-at target set",
      );
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

    it("should set orbitActive to false in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.orbitActive).toBe(false);
    });

    it("should use defaults in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.speed).toBe(DEFAULT_ORBIT_SPEED);
      expect(response.structuredContent.direction).toBe("counterclockwise");
    });

    it("should set responseTime to 0 in error response", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Test error"),
      );

      const response = await registeredHandler({});

      expect(response.structuredContent.stats.responseTime).toBe(0);
    });
  });

  describe("Speed direction logic", () => {
    it("should always send positive speed for counterclockwise regardless of input sign", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const testCases = [
        { input: 0.01, expected: 0.01 },
        { input: -0.01, expected: 0.01 },
      ];

      for (const { input, expected } of testCases) {
        await registeredHandler({
          speed: input,
          direction: "counterclockwise",
        });

        expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            speed: expected,
          }),
          undefined,
        );
      }
    });

    it("should always send negative speed for clockwise regardless of input sign", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const testCases = [
        { input: 0.01, expected: -0.01 },
        { input: -0.01, expected: -0.01 },
      ];

      for (const { input, expected } of testCases) {
        await registeredHandler({ speed: input, direction: "clockwise" });

        expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            speed: expected,
          }),
          undefined,
        );
      }
    });
  });
});
