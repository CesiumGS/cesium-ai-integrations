import { describe, it, expect } from "vitest";
import { UnifiedAnimationInputSchema } from "../../src/schemas/unified-animation-schema";

const minSample = {
  time: "2024-01-01T00:00:00Z",
  longitude: -105,
  latitude: 40,
};
const maxSample = {
  time: "2024-01-01T01:00:00Z",
  longitude: -104,
  latitude: 40.5,
  height: 1000,
};

describe("UnifiedAnimationInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal input with just positionSamples", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
        }).success,
      ).toBe(true);
    });

    it("should accept full animation input", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          name: "Test Route",
          positionSamples: [minSample, maxSample],
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          interpolationAlgorithm: "LAGRANGE",
          showPath: true,
          modelPreset: "cesium_man",
          modelScale: 1.5,
          loopMode: "loop",
          clampToGround: false,
          speedMultiplier: 10,
          autoPlay: true,
          trackCamera: false,
        }).success,
      ).toBe(true);
    });

    it("should apply default speedMultiplier of 10", () => {
      const result = UnifiedAnimationInputSchema.safeParse({
        positionSamples: [minSample, maxSample],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.speedMultiplier).toBe(10);
      }
    });

    it("should apply default loopMode of none", () => {
      const result = UnifiedAnimationInputSchema.safeParse({
        positionSamples: [minSample, maxSample],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loopMode).toBe("none");
      }
    });

    it("should apply default autoPlay of true", () => {
      const result = UnifiedAnimationInputSchema.safeParse({
        positionSamples: [minSample, maxSample],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoPlay).toBe(true);
      }
    });

    it("should apply default trackCamera of true", () => {
      const result = UnifiedAnimationInputSchema.safeParse({
        positionSamples: [minSample, maxSample],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trackCamera).toBe(true);
      }
    });

    it("should accept pingpong loop mode", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          loopMode: "pingpong",
        }).success,
      ).toBe(true);
    });

    it("should accept all interpolation algorithms", () => {
      for (const algo of ["LINEAR", "LAGRANGE", "HERMITE"] as const) {
        expect(
          UnifiedAnimationInputSchema.safeParse({
            positionSamples: [minSample, maxSample],
            interpolationAlgorithm: algo,
          }).success,
        ).toBe(true);
      }
    });

    it("should accept speedMultiplier at minimum boundary 0.1", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          speedMultiplier: 0.1,
        }).success,
      ).toBe(true);
    });

    it("should accept speedMultiplier at maximum boundary 100", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          speedMultiplier: 100,
        }).success,
      ).toBe(true);
    });

    it("should accept custom modelUri", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          modelUri: "https://example.com/model.glb",
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing positionSamples", () => {
      expect(UnifiedAnimationInputSchema.safeParse({}).success).toBe(false);
    });

    it("should reject positionSamples with only one sample", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({ positionSamples: [minSample] })
          .success,
      ).toBe(false);
    });

    it("should reject invalid loopMode", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          loopMode: "repeat",
        }).success,
      ).toBe(false);
    });

    it("should reject speedMultiplier below 0.1", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          speedMultiplier: 0.05,
        }).success,
      ).toBe(false);
    });

    it("should reject speedMultiplier above 100", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          speedMultiplier: 101,
        }).success,
      ).toBe(false);
    });

    it("should reject invalid modelPreset", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          modelPreset: "helicopter",
        }).success,
      ).toBe(false);
    });

    it("should reject negative modelScale", () => {
      expect(
        UnifiedAnimationInputSchema.safeParse({
          positionSamples: [minSample, maxSample],
          modelScale: -1,
        }).success,
      ).toBe(false);
    });
  });
});
