import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGlobeSetLighting } from "../../src/tools/globe-set-lighting";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { ClockResponse } from "../../src/schemas/index";

describe("globe_set_lighting tool", () => {
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

    registerGlobeSetLighting(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register globe_set_lighting tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "globe_set_lighting",
        expect.objectContaining({ title: "Control Globe Lighting" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should send globe lighting command with enableLighting=true", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "globe_lighting",
          enableLighting: true,
          enableDynamicAtmosphere: true,
          enableSunLighting: true,
        }),
        expect.any(Number),
      );
    });

    it("should send globe lighting command with enableLighting=false", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      await registeredHandler({
        enableLighting: false,
        enableDynamicAtmosphere: false,
        enableSunLighting: false,
      });

      expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({ enableLighting: false }),
        expect.any(Number),
      );
    });

    it("should return success response with enabled message", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: false,
      });

      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.message).toContain("enabled");
    });

    it("should return success response with disabled message", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: true,
      });

      const response = await registeredHandler({
        enableLighting: false,
        enableDynamicAtmosphere: false,
        enableSunLighting: false,
      });

      expect(response.structuredContent.message).toContain("disabled");
    });
  });

  describe("Unhappy paths", () => {
    it("should return error when client fails", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockResolvedValue({
        success: false,
        error: "Client error",
      });

      const response = await registeredHandler({
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when executeCommand throws", async () => {
      vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(
        new Error("Connection refused"),
      );

      const response = await registeredHandler({
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain(
        "Connection refused",
      );
    });
  });
});
