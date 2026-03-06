import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnimationCreate } from "../../src/tools/animation-create";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { AnimationCreateResponse } from "../../src/schemas/index";

// Mock dependencies
vi.mock("../../src/utils/animation-creator.js", () => ({
  createAnimation: vi.fn(),
}));

vi.mock("../../src/utils/model-registry.js", () => ({
  resolveModelUri: vi
    .fn()
    .mockReturnValue("https://assets.cesium.com/1/model.glb"),
}));

import { createAnimation } from "../../src/utils/animation-creator.js";
import { resolveModelUri } from "../../src/utils/model-registry.js";

const minSample = {
  time: "2024-01-01T00:00:00Z",
  longitude: -105,
  latitude: 40,
  height: 0,
};
const maxSample = {
  time: "2024-01-01T01:00:00Z",
  longitude: -104,
  latitude: 40.5,
  height: 1000,
};

describe("animation_create tool", () => {
  let mockServer: McpServer;
  let mockCommunicationServer: ICommunicationServer;
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: AnimationCreateResponse;
    isError: boolean;
  }>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServer = {
      registerTool: vi.fn((_name, _config, handler) => {
        registeredHandler = handler;
      }),
    } as unknown as McpServer;

    mockCommunicationServer = {
      executeCommand: vi.fn(),
    } as unknown as ICommunicationServer;

    vi.mocked(resolveModelUri).mockReturnValue(
      "https://assets.cesium.com/1/model.glb",
    );

    registerAnimationCreate(mockServer, mockCommunicationServer);
  });

  describe("Tool registration", () => {
    it("should register animation_create tool", () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "animation_create",
        expect.objectContaining({ title: "Create Animation" }),
        expect.any(Function),
      );
    });
  });

  describe("Happy paths", () => {
    it("should create animation with minimal valid input and return correct response", async () => {
      vi.mocked(createAnimation).mockResolvedValue({
        success: true,
        animationId: "anim-generated-001",
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelPreset: "cesium_man",
        responseTime: 50,
      });

      const response = await registeredHandler({
        positionSamples: [minSample, maxSample],
      });

      expect(createAnimation).toHaveBeenCalledWith(
        mockCommunicationServer,
        expect.objectContaining({
          positionSamples: [minSample, maxSample],
        }),
      );
      expect(response.structuredContent.success).toBe(true);
      expect(response.structuredContent.animationId).toBe("anim-generated-001");
      expect(response.structuredContent.startTime).toBe("2024-01-01T00:00:00Z");
      expect(response.structuredContent.stopTime).toBe("2024-01-01T01:00:00Z");
      expect(response.structuredContent.message).toContain(
        "2 position samples",
      );
    });

    it("should pass modelPreset to createAnimation", async () => {
      vi.mocked(createAnimation).mockResolvedValue({
        success: true,
        animationId: "anim-001",
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelPreset: "cesium_air",
        responseTime: 40,
      });

      await registeredHandler({
        positionSamples: [minSample, maxSample],
        modelPreset: "cesium_air",
      });

      expect(createAnimation).toHaveBeenCalledWith(
        mockCommunicationServer,
        expect.objectContaining({ modelPreset: "cesium_air" }),
      );
    });

    it("should pass name when provided", async () => {
      vi.mocked(createAnimation).mockResolvedValue({
        success: true,
        animationId: "anim-001",
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelPreset: "cesium_man",
        responseTime: 20,
      });

      await registeredHandler({
        positionSamples: [minSample, maxSample],
        name: "My Animation",
      });

      expect(createAnimation).toHaveBeenCalledWith(
        mockCommunicationServer,
        expect.objectContaining({ name: "My Animation" }),
      );
    });
  });

  describe("Unhappy paths", () => {
    it("should return error when createAnimation fails", async () => {
      vi.mocked(createAnimation).mockResolvedValue({
        success: false,
        error: "Insufficient position samples",
        responseTime: 0,
      });

      const response = await registeredHandler({
        positionSamples: [minSample, maxSample],
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.isError).toBe(true);
    });

    it("should return error when createAnimation throws", async () => {
      vi.mocked(createAnimation).mockRejectedValue(new Error("Network error"));

      const response = await registeredHandler({
        positionSamples: [minSample, maxSample],
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Network error");
    });

    it("should return error when resolveModelUri throws", async () => {
      vi.mocked(resolveModelUri).mockImplementation(() => {
        throw new Error("Unknown model preset");
      });

      const response = await registeredHandler({
        positionSamples: [minSample, maxSample],
        modelPreset: "cesium_man",
      });

      expect(response.structuredContent.success).toBe(false);
      expect(response.structuredContent.message).toContain("Failed");
    });
  });
});
