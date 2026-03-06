import { describe, it, expect } from "vitest";
import {
  CameraFlyToInputSchema,
  CameraSetViewInputSchema,
  CameraLookAtTransformInputSchema,
  OrbitOptionsSchema,
  CameraControllerOptionsSchema,
} from "../../src/schemas/tool-schemas";

describe("CameraFlyToInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal valid input with only destination", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept full valid input with all optional fields", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: -105.0178, latitude: 39.7392, height: 1609 },
        orientation: { heading: 90, pitch: -45, roll: 0 },
        duration: 5,
        easingFunction: "CUBIC_IN_OUT",
        maximumHeight: 10000,
        pitchAdjustHeight: 500,
        flyOverLongitude: -100,
        flyOverLongitudeWeight: 0.5,
      });
      expect(result.success).toBe(true);
    });

    it("should accept duration of 0", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        duration: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept flyOverLongitudeWeight at minimum boundary (0)", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        flyOverLongitudeWeight: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept flyOverLongitudeWeight at maximum boundary (1)", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        flyOverLongitudeWeight: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximumHeight at 0", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        maximumHeight: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing destination", () => {
      const result = CameraFlyToInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid destination", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 200, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative duration", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        duration: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid easingFunction", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        easingFunction: "INVALID_EASING",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative maximumHeight", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        maximumHeight: -100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative pitchAdjustHeight", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        pitchAdjustHeight: -50,
      });
      expect(result.success).toBe(false);
    });

    it("should reject flyOverLongitudeWeight less than 0", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        flyOverLongitudeWeight: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject flyOverLongitudeWeight greater than 1", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        flyOverLongitudeWeight: 1.1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject duration as string", () => {
      const result = CameraFlyToInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        duration: "5",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraSetViewInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal valid input with only destination", () => {
      const result = CameraSetViewInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept full valid input with orientation", () => {
      const result = CameraSetViewInputSchema.safeParse({
        destination: { longitude: -105.0178, latitude: 39.7392, height: 1609 },
        orientation: { heading: 90, pitch: -45, roll: 10 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing destination", () => {
      const result = CameraSetViewInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid destination", () => {
      const result = CameraSetViewInputSchema.safeParse({
        destination: { longitude: 200, latitude: 100, height: -1 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid orientation", () => {
      const result = CameraSetViewInputSchema.safeParse({
        destination: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 100, roll: 0 },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraLookAtTransformInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal valid input with only target", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: 0, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept full valid input with offset", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: -105.0178, latitude: 39.7392, height: 1609 },
        offset: { heading: 45, pitch: -30, range: 5000 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept offset with range at 0", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: 0, latitude: 0, height: 0 },
        offset: { heading: 0, pitch: 0, range: 0 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing target", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid target", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: 200, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative range in offset", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: 0, latitude: 0, height: 0 },
        offset: { heading: 0, pitch: 0, range: -100 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject incomplete offset (missing range)", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: 0, latitude: 0, height: 0 },
        offset: { heading: 0, pitch: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject offset with string range", () => {
      const result = CameraLookAtTransformInputSchema.safeParse({
        target: { longitude: 0, latitude: 0, height: 0 },
        offset: { heading: 0, pitch: 0, range: "1000" },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("OrbitOptionsSchema", () => {
  describe("Happy paths", () => {
    it("should accept empty object (all fields optional)", () => {
      const result = OrbitOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept valid speed", () => {
      const result = OrbitOptionsSchema.safeParse({ speed: 0.01 });
      expect(result.success).toBe(true);
    });

    it("should accept clockwise direction", () => {
      const result = OrbitOptionsSchema.safeParse({ direction: "clockwise" });
      expect(result.success).toBe(true);
    });

    it("should accept counterclockwise direction", () => {
      const result = OrbitOptionsSchema.safeParse({
        direction: "counterclockwise",
      });
      expect(result.success).toBe(true);
    });

    it("should accept both speed and direction", () => {
      const result = OrbitOptionsSchema.safeParse({
        speed: 0.005,
        direction: "clockwise",
      });
      expect(result.success).toBe(true);
    });

    it("should accept negative speed", () => {
      const result = OrbitOptionsSchema.safeParse({ speed: -0.005 });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject invalid direction value", () => {
      const result = OrbitOptionsSchema.safeParse({ direction: "forward" });
      expect(result.success).toBe(false);
    });

    it("should reject direction as number", () => {
      const result = OrbitOptionsSchema.safeParse({ direction: 1 });
      expect(result.success).toBe(false);
    });

    it("should reject speed as string", () => {
      const result = OrbitOptionsSchema.safeParse({ speed: "0.005" });
      expect(result.success).toBe(false);
    });

    it("should reject speed as NaN", () => {
      const result = OrbitOptionsSchema.safeParse({ speed: NaN });
      expect(result.success).toBe(false);
    });

    it("should reject empty string for direction", () => {
      const result = OrbitOptionsSchema.safeParse({ direction: "" });
      expect(result.success).toBe(false);
    });

    it("should reject zero speed", () => {
      const result = OrbitOptionsSchema.safeParse({ speed: 0 });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraControllerOptionsSchema", () => {
  describe("Happy paths", () => {
    it("should accept empty object (all fields optional)", () => {
      const result = CameraControllerOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept enableCollisionDetection as true", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableCollisionDetection: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept enableCollisionDetection as false", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableCollisionDetection: false,
      });
      expect(result.success).toBe(true);
    });

    it("should accept minimumZoomDistance at 0", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        minimumZoomDistance: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximumZoomDistance at boundary", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        maximumZoomDistance: 1000000,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all boolean enable flags", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableTilt: true,
        enableRotate: false,
        enableTranslate: true,
        enableZoom: false,
        enableLook: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all fields populated", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableCollisionDetection: true,
        minimumZoomDistance: 10,
        maximumZoomDistance: 50000,
        enableTilt: true,
        enableRotate: true,
        enableTranslate: true,
        enableZoom: true,
        enableLook: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject negative minimumZoomDistance", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        minimumZoomDistance: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative maximumZoomDistance", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        maximumZoomDistance: -100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject minimumZoomDistance as string", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        minimumZoomDistance: "10",
      });
      expect(result.success).toBe(false);
    });

    it("should reject maximumZoomDistance as string", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        maximumZoomDistance: "50000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject enableCollisionDetection as string", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableCollisionDetection: "true",
      });
      expect(result.success).toBe(false);
    });

    it("should reject enableTilt as number", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableTilt: 1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject enableRotate as null", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableRotate: null,
      });
      expect(result.success).toBe(false);
    });

    it("should reject enableZoom as object", () => {
      const result = CameraControllerOptionsSchema.safeParse({
        enableZoom: { value: true },
      });
      expect(result.success).toBe(false);
    });
  });
});
