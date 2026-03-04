import { describe, it, expect } from "vitest";
import {
  CesiumPositionSchema,
  CesiumOrientationSchema,
  EasingFunctionSchema,
} from "../../src/schemas/core-schemas";

describe("CesiumPositionSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid position with all fields at minimum boundaries", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: -180,
        latitude: -90,
        height: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid position with all fields at maximum boundaries", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 180,
        latitude: 90,
        height: 100000,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid position with zero values", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid position with typical values", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: -105.0178,
        latitude: 39.7392,
        height: 1609.344,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid position with maximum precision floats", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: -123.456789012345,
        latitude: 45.678901234567,
        height: 1234.567890123456,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths - longitude", () => {
    it("should reject longitude less than -180", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: -180.1,
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("longitude");
      }
    });

    it("should reject longitude greater than 180", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 180.1,
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject longitude as string", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: "123",
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject longitude as NaN", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: NaN,
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject longitude as Infinity", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: Infinity,
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing longitude", () => {
      const result = CesiumPositionSchema.safeParse({
        latitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unhappy paths - latitude", () => {
    it("should reject latitude less than -90", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: -90.1,
        height: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("latitude");
      }
    });

    it("should reject latitude greater than 90", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: 90.1,
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject latitude as string", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: "45",
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject latitude as null", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: null,
        height: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing latitude", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        height: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unhappy paths - height", () => {
    it("should reject negative height", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: 0,
        height: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("height");
      }
    });

    it("should reject height as string", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: 0,
        height: "1000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject height as boolean", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: 0,
        height: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing height", () => {
      const result = CesiumPositionSchema.safeParse({
        longitude: 0,
        latitude: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unhappy paths - invalid types", () => {
    it("should reject array instead of object", () => {
      const result = CesiumPositionSchema.safeParse([0, 0, 0]);
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = CesiumPositionSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject undefined", () => {
      const result = CesiumPositionSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("should reject empty object", () => {
      const result = CesiumPositionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("CesiumOrientationSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid orientation with pitch at minimum boundary", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: -90,
        roll: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid orientation with pitch at maximum boundary", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: 90,
        roll: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid orientation with typical values", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 45,
        pitch: -30,
        roll: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should accept heading beyond 360 degrees", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 720,
        pitch: 0,
        roll: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept negative heading", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: -180,
        pitch: 0,
        roll: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept large roll values", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: 0,
        roll: 540,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths - pitch", () => {
    it("should reject pitch less than -90", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: -90.1,
        roll: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("pitch");
      }
    });

    it("should reject pitch greater than 90", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: 90.1,
        roll: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject pitch as string", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: "-45",
        roll: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unhappy paths - heading", () => {
    it("should reject heading as string", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: "90",
        pitch: 0,
        roll: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject heading as NaN", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: NaN,
        pitch: 0,
        roll: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing heading", () => {
      const result = CesiumOrientationSchema.safeParse({
        pitch: 0,
        roll: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unhappy paths - roll", () => {
    it("should reject roll as string", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: 0,
        roll: "15",
      });
      expect(result.success).toBe(false);
    });

    it("should reject roll as null", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: 0,
        roll: null,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing roll", () => {
      const result = CesiumOrientationSchema.safeParse({
        heading: 0,
        pitch: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unhappy paths - invalid types", () => {
    it("should reject empty object", () => {
      const result = CesiumOrientationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = CesiumOrientationSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject array", () => {
      const result = CesiumOrientationSchema.safeParse([0, 0, 0]);
      expect(result.success).toBe(false);
    });
  });
});

describe("EasingFunctionSchema", () => {
  describe("Happy paths", () => {
    it("should accept undefined (optional field)", () => {
      const result = EasingFunctionSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept LINEAR_NONE", () => {
      const result = EasingFunctionSchema.safeParse("LINEAR_NONE");
      expect(result.success).toBe(true);
    });

    it("should accept QUADRATIC_IN", () => {
      const result = EasingFunctionSchema.safeParse("QUADRATIC_IN");
      expect(result.success).toBe(true);
    });

    it("should accept QUADRATIC_OUT", () => {
      const result = EasingFunctionSchema.safeParse("QUADRATIC_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept QUADRATIC_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("QUADRATIC_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept CUBIC_IN", () => {
      const result = EasingFunctionSchema.safeParse("CUBIC_IN");
      expect(result.success).toBe(true);
    });

    it("should accept CUBIC_OUT", () => {
      const result = EasingFunctionSchema.safeParse("CUBIC_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept CUBIC_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("CUBIC_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept QUARTIC_IN", () => {
      const result = EasingFunctionSchema.safeParse("QUARTIC_IN");
      expect(result.success).toBe(true);
    });

    it("should accept QUARTIC_OUT", () => {
      const result = EasingFunctionSchema.safeParse("QUARTIC_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept QUARTIC_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("QUARTIC_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept QUINTIC_IN", () => {
      const result = EasingFunctionSchema.safeParse("QUINTIC_IN");
      expect(result.success).toBe(true);
    });

    it("should accept QUINTIC_OUT", () => {
      const result = EasingFunctionSchema.safeParse("QUINTIC_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept QUINTIC_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("QUINTIC_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept SINUSOIDAL_IN", () => {
      const result = EasingFunctionSchema.safeParse("SINUSOIDAL_IN");
      expect(result.success).toBe(true);
    });

    it("should accept SINUSOIDAL_OUT", () => {
      const result = EasingFunctionSchema.safeParse("SINUSOIDAL_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept SINUSOIDAL_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("SINUSOIDAL_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept EXPONENTIAL_IN", () => {
      const result = EasingFunctionSchema.safeParse("EXPONENTIAL_IN");
      expect(result.success).toBe(true);
    });

    it("should accept EXPONENTIAL_OUT", () => {
      const result = EasingFunctionSchema.safeParse("EXPONENTIAL_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept EXPONENTIAL_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("EXPONENTIAL_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept CIRCULAR_IN", () => {
      const result = EasingFunctionSchema.safeParse("CIRCULAR_IN");
      expect(result.success).toBe(true);
    });

    it("should accept CIRCULAR_OUT", () => {
      const result = EasingFunctionSchema.safeParse("CIRCULAR_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept CIRCULAR_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("CIRCULAR_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept BACK_IN", () => {
      const result = EasingFunctionSchema.safeParse("BACK_IN");
      expect(result.success).toBe(true);
    });

    it("should accept BACK_OUT", () => {
      const result = EasingFunctionSchema.safeParse("BACK_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept BACK_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("BACK_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept ELASTIC_IN", () => {
      const result = EasingFunctionSchema.safeParse("ELASTIC_IN");
      expect(result.success).toBe(true);
    });

    it("should accept ELASTIC_OUT", () => {
      const result = EasingFunctionSchema.safeParse("ELASTIC_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept ELASTIC_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("ELASTIC_IN_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept BOUNCE_IN", () => {
      const result = EasingFunctionSchema.safeParse("BOUNCE_IN");
      expect(result.success).toBe(true);
    });

    it("should accept BOUNCE_OUT", () => {
      const result = EasingFunctionSchema.safeParse("BOUNCE_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept BOUNCE_IN_OUT", () => {
      const result = EasingFunctionSchema.safeParse("BOUNCE_IN_OUT");
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject invalid string", () => {
      const result = EasingFunctionSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });

    it("should reject lowercase enum value", () => {
      const result = EasingFunctionSchema.safeParse("linear_none");
      expect(result.success).toBe(false);
    });

    it("should reject partial enum value", () => {
      const result = EasingFunctionSchema.safeParse("LINEAR");
      expect(result.success).toBe(false);
    });

    it("should reject number", () => {
      const result = EasingFunctionSchema.safeParse(1);
      expect(result.success).toBe(false);
    });

    it("should reject boolean", () => {
      const result = EasingFunctionSchema.safeParse(true);
      expect(result.success).toBe(false);
    });

    it("should reject object", () => {
      const result = EasingFunctionSchema.safeParse({ type: "LINEAR_NONE" });
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = EasingFunctionSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = EasingFunctionSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });
});
