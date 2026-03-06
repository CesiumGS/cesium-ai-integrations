import { describe, it, expect } from "vitest";
import {
  PositionSchema,
  ColorSchema,
  JulianDateSchema,
  TimeIntervalSchema,
  PositionSampleSchema,
  ClockSchema,
  PolylineMaterialSchema,
  ModelPresetSchema,
  TravelModeSchema,
  LoopModeSchema,
  InterpolationAlgorithmSchema,
} from "../../src/schemas/core-schemas";

// ---------------------------------------------------------------------------
// PositionSchema
// ---------------------------------------------------------------------------
describe("PositionSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimum boundary values", () => {
      expect(
        PositionSchema.safeParse({ longitude: -180, latitude: -90 }).success,
      ).toBe(true);
    });

    it("should accept maximum boundary values", () => {
      expect(
        PositionSchema.safeParse({ longitude: 180, latitude: 90 }).success,
      ).toBe(true);
    });

    it("should accept position with optional height", () => {
      expect(
        PositionSchema.safeParse({ longitude: 0, latitude: 0, height: 500 })
          .success,
      ).toBe(true);
    });

    it("should accept position without height", () => {
      expect(
        PositionSchema.safeParse({ longitude: -105.0178, latitude: 39.7392 })
          .success,
      ).toBe(true);
    });

    it("should accept zero height", () => {
      expect(
        PositionSchema.safeParse({ longitude: 0, latitude: 0, height: 0 })
          .success,
      ).toBe(true);
    });

    it("should accept negative height (underground)", () => {
      expect(
        PositionSchema.safeParse({ longitude: 0, latitude: 0, height: -100 })
          .success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject longitude below -180", () => {
      const result = PositionSchema.safeParse({
        longitude: -180.1,
        latitude: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject longitude above 180", () => {
      const result = PositionSchema.safeParse({
        longitude: 180.1,
        latitude: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject latitude below -90", () => {
      const result = PositionSchema.safeParse({
        longitude: 0,
        latitude: -90.1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject latitude above 90", () => {
      const result = PositionSchema.safeParse({ longitude: 0, latitude: 90.1 });
      expect(result.success).toBe(false);
    });

    it("should reject string longitude", () => {
      const result = PositionSchema.safeParse({
        longitude: "-105",
        latitude: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing longitude", () => {
      const result = PositionSchema.safeParse({ latitude: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject missing latitude", () => {
      const result = PositionSchema.safeParse({ longitude: 0 });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ColorSchema
// ---------------------------------------------------------------------------
describe("ColorSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid RGBA color", () => {
      expect(
        ColorSchema.safeParse({ red: 1, green: 0.5, blue: 0, alpha: 0.8 })
          .success,
      ).toBe(true);
    });

    it("should accept color without alpha (defaults to 1)", () => {
      const result = ColorSchema.safeParse({ red: 1, green: 0, blue: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alpha).toBe(1);
      }
    });

    it("should accept boundary values (0 and 1)", () => {
      expect(
        ColorSchema.safeParse({ red: 0, green: 0, blue: 0, alpha: 0 }).success,
      ).toBe(true);
      expect(
        ColorSchema.safeParse({ red: 1, green: 1, blue: 1, alpha: 1 }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject red above 1", () => {
      expect(
        ColorSchema.safeParse({ red: 1.1, green: 0, blue: 0 }).success,
      ).toBe(false);
    });

    it("should reject green below 0", () => {
      expect(
        ColorSchema.safeParse({ red: 0, green: -0.1, blue: 0 }).success,
      ).toBe(false);
    });

    it("should reject alpha above 1", () => {
      expect(
        ColorSchema.safeParse({ red: 0, green: 0, blue: 0, alpha: 1.1 })
          .success,
      ).toBe(false);
    });

    it("should reject missing required fields", () => {
      expect(ColorSchema.safeParse({ red: 1 }).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// JulianDateSchema
// ---------------------------------------------------------------------------
describe("JulianDateSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid Julian date", () => {
      expect(
        JulianDateSchema.safeParse({ dayNumber: 2451545, secondsOfDay: 0 })
          .success,
      ).toBe(true);
    });

    it("should accept large dayNumber", () => {
      expect(
        JulianDateSchema.safeParse({ dayNumber: 2460000, secondsOfDay: 43200 })
          .success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject string dayNumber", () => {
      expect(
        JulianDateSchema.safeParse({ dayNumber: "2451545", secondsOfDay: 0 })
          .success,
      ).toBe(false);
    });

    it("should reject missing secondsOfDay", () => {
      expect(JulianDateSchema.safeParse({ dayNumber: 2451545 }).success).toBe(
        false,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TimeIntervalSchema
// ---------------------------------------------------------------------------
describe("TimeIntervalSchema", () => {
  const start = { dayNumber: 2451545, secondsOfDay: 0 };
  const stop = { dayNumber: 2451546, secondsOfDay: 0 };

  describe("Happy paths", () => {
    it("should accept valid time interval", () => {
      expect(TimeIntervalSchema.safeParse({ start, stop }).success).toBe(true);
    });

    it("should accept interval with optional flags set to false", () => {
      expect(
        TimeIntervalSchema.safeParse({
          start,
          stop,
          isStartIncluded: false,
          isStopIncluded: false,
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing start", () => {
      expect(TimeIntervalSchema.safeParse({ stop }).success).toBe(false);
    });

    it("should reject missing stop", () => {
      expect(TimeIntervalSchema.safeParse({ start }).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// PositionSampleSchema
// ---------------------------------------------------------------------------
describe("PositionSampleSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal valid sample", () => {
      expect(
        PositionSampleSchema.safeParse({
          time: "2024-01-01T00:00:00Z",
          longitude: 0,
          latitude: 0,
        }).success,
      ).toBe(true);
    });

    it("should accept sample with height (defaults to 0 if omitted)", () => {
      const result = PositionSampleSchema.safeParse({
        time: "2024-01-01T00:00:00Z",
        longitude: -105,
        latitude: 40,
        height: 1000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing time", () => {
      expect(
        PositionSampleSchema.safeParse({ longitude: 0, latitude: 0 }).success,
      ).toBe(false);
    });

    it("should reject missing longitude", () => {
      expect(
        PositionSampleSchema.safeParse({
          time: "2024-01-01T00:00:00Z",
          latitude: 0,
        }).success,
      ).toBe(false);
    });

    it("should reject string latitude", () => {
      expect(
        PositionSampleSchema.safeParse({
          time: "2024-01-01T00:00:00Z",
          longitude: 0,
          latitude: "40",
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ClockSchema
// ---------------------------------------------------------------------------
describe("ClockSchema", () => {
  const julianDate = { dayNumber: 2451545, secondsOfDay: 0 };

  describe("Happy paths", () => {
    it("should accept valid clock configuration", () => {
      expect(
        ClockSchema.safeParse({
          startTime: julianDate,
          stopTime: julianDate,
          currentTime: julianDate,
          clockRange: "LOOP_STOP",
        }).success,
      ).toBe(true);
    });

    it("should accept all valid clockRange values", () => {
      for (const range of ["UNBOUNDED", "CLAMPED", "LOOP_STOP"] as const) {
        expect(
          ClockSchema.safeParse({
            startTime: julianDate,
            stopTime: julianDate,
            currentTime: julianDate,
            clockRange: range,
          }).success,
        ).toBe(true);
      }
    });

    it("should apply default multiplier of 1", () => {
      const result = ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: julianDate,
        currentTime: julianDate,
        clockRange: "UNBOUNDED",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.multiplier).toBe(1);
      }
    });

    it("should apply default shouldAnimate of true", () => {
      const result = ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: julianDate,
        currentTime: julianDate,
        clockRange: "UNBOUNDED",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shouldAnimate).toBe(true);
      }
    });
  });

  describe("Unhappy paths", () => {
    it("should reject invalid clockRange", () => {
      expect(
        ClockSchema.safeParse({
          startTime: julianDate,
          stopTime: julianDate,
          currentTime: julianDate,
          clockRange: "INVALID",
        }).success,
      ).toBe(false);
    });

    it("should reject missing startTime", () => {
      expect(
        ClockSchema.safeParse({
          stopTime: julianDate,
          currentTime: julianDate,
          clockRange: "UNBOUNDED",
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// PolylineMaterialSchema
// ---------------------------------------------------------------------------
describe("PolylineMaterialSchema", () => {
  const color = { red: 1, green: 0, blue: 0 };

  describe("Happy paths", () => {
    it("should accept color material", () => {
      expect(
        PolylineMaterialSchema.safeParse({ type: "color", color }).success,
      ).toBe(true);
    });

    it("should accept outline material", () => {
      expect(
        PolylineMaterialSchema.safeParse({
          type: "outline",
          color,
          outlineWidth: 2,
          outlineColor: color,
        }).success,
      ).toBe(true);
    });

    it("should accept glow material", () => {
      expect(
        PolylineMaterialSchema.safeParse({
          type: "glow",
          color,
          glowPower: 0.5,
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject unknown type", () => {
      expect(
        PolylineMaterialSchema.safeParse({ type: "dash", color }).success,
      ).toBe(false);
    });

    it("should reject glow with glowPower > 1", () => {
      expect(
        PolylineMaterialSchema.safeParse({
          type: "glow",
          color,
          glowPower: 1.5,
        }).success,
      ).toBe(false);
    });

    it("should reject glow with negative glowPower", () => {
      expect(
        PolylineMaterialSchema.safeParse({
          type: "glow",
          color,
          glowPower: -0.1,
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ModelPresetSchema
// ---------------------------------------------------------------------------
describe("ModelPresetSchema", () => {
  it("should accept all valid presets", () => {
    for (const preset of [
      "cesium_man",
      "cesium_air",
      "ground_vehicle",
      "cesium_drone",
      "custom",
    ] as const) {
      expect(ModelPresetSchema.safeParse(preset).success).toBe(true);
    }
  });

  it("should reject unknown preset", () => {
    expect(ModelPresetSchema.safeParse("helicopter").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TravelModeSchema
// ---------------------------------------------------------------------------
describe("TravelModeSchema", () => {
  it("should accept all valid travel modes", () => {
    for (const mode of [
      "walking",
      "driving",
      "cycling",
      "bicycling",
      "transit",
      "flying",
    ] as const) {
      expect(TravelModeSchema.safeParse(mode).success).toBe(true);
    }
  });

  it("should reject unknown travel mode", () => {
    expect(TravelModeSchema.safeParse("swimming").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LoopModeSchema
// ---------------------------------------------------------------------------
describe("LoopModeSchema", () => {
  it("should accept all valid loop modes", () => {
    for (const mode of ["none", "loop", "pingpong"] as const) {
      expect(LoopModeSchema.safeParse(mode).success).toBe(true);
    }
  });

  it("should reject unknown loop mode", () => {
    expect(LoopModeSchema.safeParse("repeat").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// InterpolationAlgorithmSchema
// ---------------------------------------------------------------------------
describe("InterpolationAlgorithmSchema", () => {
  it("should accept all valid algorithms", () => {
    for (const algo of ["LINEAR", "LAGRANGE", "HERMITE"] as const) {
      expect(InterpolationAlgorithmSchema.safeParse(algo).success).toBe(true);
    }
  });

  it("should reject unknown algorithm", () => {
    expect(InterpolationAlgorithmSchema.safeParse("CUBIC").success).toBe(false);
  });
});
