import { describe, it, expect } from "vitest";
import {
  PositionSchema,
  ColorSchema,
  JulianDateSchema,
  TimeIntervalSchema,
  PositionSampleSchema,
  MaterialSchema,
  PolylineMaterialSchema,
  ClockSchema,
} from "../../src/schemas/core-schemas";

// ---------------------------------------------------------------------------
// PositionSchema
// ---------------------------------------------------------------------------
describe("PositionSchema", () => {
  describe("Happy paths", () => {
    it("should accept boundary minimum values", () => {
      expect(
        PositionSchema.safeParse({ longitude: -180, latitude: -90 }).success,
      ).toBe(true);
    });

    it("should accept boundary maximum values", () => {
      expect(
        PositionSchema.safeParse({ longitude: 180, latitude: 90 }).success,
      ).toBe(true);
    });

    it("should accept position with height", () => {
      expect(
        PositionSchema.safeParse({ longitude: 0, latitude: 0, height: 1000 })
          .success,
      ).toBe(true);
    });

    it("should accept typical coordinates", () => {
      expect(
        PositionSchema.safeParse({
          longitude: -73.9857,
          latitude: 40.7484,
          height: 10,
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject longitude below -180", () => {
      expect(
        PositionSchema.safeParse({ longitude: -181, latitude: 0 }).success,
      ).toBe(false);
    });

    it("should reject longitude above 180", () => {
      expect(
        PositionSchema.safeParse({ longitude: 181, latitude: 0 }).success,
      ).toBe(false);
    });

    it("should reject latitude below -90", () => {
      expect(
        PositionSchema.safeParse({ longitude: 0, latitude: -91 }).success,
      ).toBe(false);
    });

    it("should reject latitude above 90", () => {
      expect(
        PositionSchema.safeParse({ longitude: 0, latitude: 91 }).success,
      ).toBe(false);
    });

    it("should reject missing longitude", () => {
      expect(PositionSchema.safeParse({ latitude: 0 }).success).toBe(false);
    });

    it("should reject missing latitude", () => {
      expect(PositionSchema.safeParse({ longitude: 0 }).success).toBe(false);
    });

    it("should reject string values", () => {
      expect(
        PositionSchema.safeParse({ longitude: "0", latitude: "0" }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ColorSchema
// ---------------------------------------------------------------------------
describe("ColorSchema", () => {
  describe("Happy paths", () => {
    it("should accept RGB at boundaries", () => {
      expect(ColorSchema.safeParse({ red: 0, green: 0, blue: 0 }).success).toBe(
        true,
      );
      expect(ColorSchema.safeParse({ red: 1, green: 1, blue: 1 }).success).toBe(
        true,
      );
    });

    it("should accept alpha at boundaries", () => {
      expect(
        ColorSchema.safeParse({ red: 0.5, green: 0.5, blue: 0.5, alpha: 0 })
          .success,
      ).toBe(true);
      expect(
        ColorSchema.safeParse({ red: 0.5, green: 0.5, blue: 0.5, alpha: 1 })
          .success,
      ).toBe(true);
    });

    it("should default alpha to 1", () => {
      const result = ColorSchema.safeParse({ red: 1, green: 0, blue: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alpha).toBe(1);
      }
    });

    it("should accept fractional values", () => {
      expect(
        ColorSchema.safeParse({ red: 0.25, green: 0.5, blue: 0.75, alpha: 0.9 })
          .success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject red above 1", () => {
      expect(
        ColorSchema.safeParse({ red: 1.01, green: 0, blue: 0 }).success,
      ).toBe(false);
    });

    it("should reject negative blue", () => {
      expect(
        ColorSchema.safeParse({ red: 0, green: 0, blue: -0.01 }).success,
      ).toBe(false);
    });

    it("should reject missing fields", () => {
      expect(ColorSchema.safeParse({ red: 1 }).success).toBe(false);
      expect(ColorSchema.safeParse({}).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// JulianDateSchema
// ---------------------------------------------------------------------------
describe("JulianDateSchema", () => {
  it("should accept valid julian date", () => {
    expect(
      JulianDateSchema.safeParse({ dayNumber: 2451545, secondsOfDay: 43200 })
        .success,
    ).toBe(true);
  });

  it("should reject missing dayNumber", () => {
    expect(JulianDateSchema.safeParse({ secondsOfDay: 0 }).success).toBe(false);
  });

  it("should reject string dayNumber", () => {
    expect(
      JulianDateSchema.safeParse({ dayNumber: "2451545", secondsOfDay: 0 })
        .success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TimeIntervalSchema
// ---------------------------------------------------------------------------
describe("TimeIntervalSchema", () => {
  const julianDate = { dayNumber: 2451545, secondsOfDay: 0 };

  it("should accept valid interval", () => {
    expect(
      TimeIntervalSchema.safeParse({ start: julianDate, stop: julianDate })
        .success,
    ).toBe(true);
  });

  it("should accept with explicit inclusion flags", () => {
    expect(
      TimeIntervalSchema.safeParse({
        start: julianDate,
        stop: julianDate,
        isStartIncluded: false,
        isStopIncluded: true,
      }).success,
    ).toBe(true);
  });

  it("should reject missing stop", () => {
    expect(TimeIntervalSchema.safeParse({ start: julianDate }).success).toBe(
      false,
    );
  });

  it("should reject invalid start date", () => {
    expect(
      TimeIntervalSchema.safeParse({
        start: {
          dayNumber: 2451545,
        },
        stop: julianDate,
        isStartIncluded: false,
        isStopIncluded: true,
      }).success,
    ).toBe(false);
  });

  it("should reject invalid stop date", () => {
    expect(
      TimeIntervalSchema.safeParse({
        start: julianDate,
        stop: {
          dayNumber: 2451545,
        },
        isStartIncluded: false,
        isStopIncluded: true,
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PositionSampleSchema (entity-server version uses JulianDate for time)
// ---------------------------------------------------------------------------
describe("PositionSampleSchema", () => {
  const julianDate = { dayNumber: 2451545, secondsOfDay: 3600 };
  const position = { longitude: -105, latitude: 40 };

  it("should accept valid position sample", () => {
    expect(
      PositionSampleSchema.safeParse({ time: julianDate, position }).success,
    ).toBe(true);
  });

  it("should accept position with height", () => {
    expect(
      PositionSampleSchema.safeParse({
        time: julianDate,
        position: { ...position, height: 1000 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing position", () => {
    expect(PositionSampleSchema.safeParse({ time: julianDate }).success).toBe(
      false,
    );
  });

  it("should reject missing time", () => {
    expect(PositionSampleSchema.safeParse({ position }).success).toBe(false);
  });

  it("should reject position with invalid time", () => {
    expect(
      PositionSampleSchema.safeParse({
        time: {
          dayNumber: 2451545,
        },
        position: { ...position, height: 1000 },
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MaterialSchema
// ---------------------------------------------------------------------------
describe("MaterialSchema", () => {
  const color = { red: 1, green: 0, blue: 0 };

  describe("Happy paths", () => {
    it("should accept color material", () => {
      expect(MaterialSchema.safeParse({ type: "color", color }).success).toBe(
        true,
      );
    });

    it("should accept image material", () => {
      expect(
        MaterialSchema.safeParse({
          type: "image",
          image: "https://example.com/texture.png",
        }).success,
      ).toBe(true);
    });

    it("should accept checkerboard material", () => {
      expect(
        MaterialSchema.safeParse({
          type: "checkerboard",
          evenColor: color,
          oddColor: { red: 0, green: 0, blue: 1 },
          repeat: { x: 4, y: 4 },
        }).success,
      ).toBe(true);
    });

    it("should accept stripe material", () => {
      expect(
        MaterialSchema.safeParse({
          type: "stripe",
          evenColor: color,
          oddColor: { red: 1, green: 1, blue: 1 },
          repeat: 10,
        }).success,
      ).toBe(true);
    });

    it("should accept grid material", () => {
      expect(
        MaterialSchema.safeParse({
          type: "grid",
          color,
          cellAlpha: 0.5,
          lineCount: { x: 8, y: 8 },
          lineThickness: { x: 1, y: 1 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject unknown material type", () => {
      expect(MaterialSchema.safeParse({ type: "gradient" }).success).toBe(
        false,
      );
    });

    it("should reject grid material with cellAlpha above 1", () => {
      expect(
        MaterialSchema.safeParse({
          type: "grid",
          color,
          cellAlpha: 1.5,
          lineCount: { x: 8, y: 8 },
          lineThickness: { x: 1, y: 1 },
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// PolylineMaterialSchema
// ---------------------------------------------------------------------------
describe("PolylineMaterialSchema", () => {
  const color = { red: 0, green: 1, blue: 0 };

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
        outlineWidth: 3,
        outlineColor: { red: 0, green: 0, blue: 0 },
      }).success,
    ).toBe(true);
  });

  it("should accept glow material at boundary (glowPower=0)", () => {
    expect(
      PolylineMaterialSchema.safeParse({ type: "glow", color, glowPower: 0 })
        .success,
    ).toBe(true);
  });

  it("should reject glow with glowPower > 1", () => {
    expect(
      PolylineMaterialSchema.safeParse({ type: "glow", color, glowPower: 1.1 })
        .success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ClockSchema
// ---------------------------------------------------------------------------
describe("ClockSchema", () => {
  const julianDate = { dayNumber: 2451545, secondsOfDay: 0 };

  it("should accept valid clock", () => {
    expect(
      ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: julianDate,
        currentTime: julianDate,
        clockRange: "LOOP_STOP",
      }).success,
    ).toBe(true);
  });

  it("should accept all clockRange values", () => {
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

  it("should reject missing clockRange", () => {
    expect(
      ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: julianDate,
        currentTime: julianDate,
      }).success,
    ).toBe(false);
  });

  it("should reject invalid startTime", () => {
    expect(
      ClockSchema.safeParse({
        startTime: {
          dayNumber: 2451545,
        },
        stopTime: julianDate,
        currentTime: julianDate,
        clockRange: "LOOP_STOP",
      }).success,
    ).toBe(false);
  });

  it("should reject invalid clockRange", () => {
    expect(
      ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: julianDate,
        currentTime: julianDate,
        clockRange: "INVALID_RANGE",
      }).success,
    ).toBe(false);
  });

  it("should reject invalid stopTime", () => {
    expect(
      ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: {
          dayNumber: 2451545,
        },
        currentTime: julianDate,
        clockRange: "LOOP_STOP",
      }).success,
    ).toBe(false);
  });

  it("should reject invalid currentTime", () => {
    expect(
      ClockSchema.safeParse({
        startTime: julianDate,
        stopTime: julianDate,
        currentTime: {
          dayNumber: 2451545,
        },
        clockRange: "LOOP_STOP",
      }).success,
    ).toBe(false);
  });
});
