import { describe, it, expect } from "vitest";
import {
  PathGraphicsSchema,
  ModelConfigSchema,
  AnimationConfigSchema,
  AnimationStateSchema,
  CameraTrackingConfigSchema,
  PathUpdateConfigSchema,
  AnimationPlayInputSchema,
  AnimationPauseInputSchema,
  AnimationControlInputSchema,
  AnimationRemoveInputSchema,
  AnimationListActiveInputSchema,
  AnimationTrackEntityInputSchema,
  AnimationUntrackCameraInputSchema,
  AnimationCameraTrackingInputSchema,
  ClockConfigureInputSchema,
  ClockSetTimeInputSchema,
  ClockControlInputSchema,
  ClockSetMultiplierInputSchema,
  GlobeSetLightingInputSchema,
  CZMLExportOptionsSchema,
  RouteAnimationConfigSchema,
} from "../../src/schemas/tool-schemas";

// Minimal valid position sample
const minSample = { time: "2024-01-01T00:00:00Z", longitude: 0, latitude: 0 };
const maxSample = { time: "2024-01-01T01:00:00Z", longitude: 10, latitude: 10 };

// ---------------------------------------------------------------------------
// PathGraphicsSchema
// ---------------------------------------------------------------------------
describe("PathGraphicsSchema", () => {
  describe("Happy paths", () => {
    it("should accept empty object (all optional)", () => {
      expect(PathGraphicsSchema.safeParse({}).success).toBe(true);
    });

    it("should accept full path graphics config", () => {
      expect(
        PathGraphicsSchema.safeParse({
          show: true,
          leadTime: 60,
          trailTime: 120,
          width: 5,
          material: { type: "color", color: { red: 1, green: 0, blue: 0 } },
          resolution: 30,
        }).success,
      ).toBe(true);
    });

    it("should apply default width of 3", () => {
      const result = PathGraphicsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.width).toBe(3);
      }
    });
  });

  describe("Unhappy paths", () => {
    it("should reject negative leadTime", () => {
      expect(PathGraphicsSchema.safeParse({ leadTime: -1 }).success).toBe(
        false,
      );
    });

    it("should reject width below 1", () => {
      expect(PathGraphicsSchema.safeParse({ width: 0 }).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ModelConfigSchema
// ---------------------------------------------------------------------------
describe("ModelConfigSchema", () => {
  describe("Happy paths", () => {
    it("should accept empty object (all optional)", () => {
      expect(ModelConfigSchema.safeParse({}).success).toBe(true);
    });

    it("should accept config with preset", () => {
      expect(
        ModelConfigSchema.safeParse({ preset: "cesium_man", scale: 1.5 })
          .success,
      ).toBe(true);
    });

    it("should accept config with custom URI", () => {
      expect(
        ModelConfigSchema.safeParse({ uri: "https://example.com/model.glb" })
          .success,
      ).toBe(true);
    });

    it("should apply default scale of 1", () => {
      const result = ModelConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scale).toBe(1);
      }
    });
  });

  describe("Unhappy paths", () => {
    it("should reject negative scale", () => {
      expect(ModelConfigSchema.safeParse({ scale: -1 }).success).toBe(false);
    });

    it("should reject invalid preset", () => {
      expect(
        ModelConfigSchema.safeParse({ preset: "unknown_model" }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationConfigSchema
// ---------------------------------------------------------------------------
describe("AnimationConfigSchema", () => {
  const validSamples = [minSample, maxSample];

  describe("Happy paths", () => {
    it("should accept minimal config with just positionSamples", () => {
      expect(
        AnimationConfigSchema.safeParse({ positionSamples: validSamples })
          .success,
      ).toBe(true);
    });

    it("should accept full config", () => {
      expect(
        AnimationConfigSchema.safeParse({
          name: "Test Animation",
          positionSamples: validSamples,
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          interpolationAlgorithm: "LAGRANGE",
          autoOrient: true,
          showPath: true,
          clampToGround: false,
          loopMode: "loop",
        }).success,
      ).toBe(true);
    });

    it("should apply default loopMode of none", () => {
      const result = AnimationConfigSchema.safeParse({
        positionSamples: validSamples,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loopMode).toBe("none");
      }
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing positionSamples", () => {
      expect(AnimationConfigSchema.safeParse({ name: "test" }).success).toBe(
        false,
      );
    });

    it("should reject positionSamples array with only one element", () => {
      expect(
        AnimationConfigSchema.safeParse({ positionSamples: [minSample] })
          .success,
      ).toBe(false);
    });

    it("should reject invalid loopMode", () => {
      expect(
        AnimationConfigSchema.safeParse({
          positionSamples: validSamples,
          loopMode: "reverse",
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationStateSchema
// ---------------------------------------------------------------------------
describe("AnimationStateSchema", () => {
  const validState = {
    animationId: "anim-001",
    isAnimating: true,
    currentTime: "2024-01-01T00:30:00Z",
    startTime: "2024-01-01T00:00:00Z",
    stopTime: "2024-01-01T01:00:00Z",
    progress: 0.5,
    elapsedSeconds: 1800,
    remainingSeconds: 1800,
    clockMultiplier: 10,
    loopMode: "none",
    hasModel: true,
    hasPath: true,
  } as const;

  describe("Happy paths", () => {
    it("should accept valid animation state", () => {
      expect(AnimationStateSchema.safeParse(validState).success).toBe(true);
    });

    it("should accept state with optional name", () => {
      expect(
        AnimationStateSchema.safeParse({ ...validState, name: "My Animation" })
          .success,
      ).toBe(true);
    });

    it("should accept progress at boundaries 0 and 1", () => {
      expect(
        AnimationStateSchema.safeParse({ ...validState, progress: 0 }).success,
      ).toBe(true);
      expect(
        AnimationStateSchema.safeParse({ ...validState, progress: 1 }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject progress above 1", () => {
      expect(
        AnimationStateSchema.safeParse({ ...validState, progress: 1.1 })
          .success,
      ).toBe(false);
    });

    it("should reject progress below 0", () => {
      expect(
        AnimationStateSchema.safeParse({ ...validState, progress: -0.1 })
          .success,
      ).toBe(false);
    });

    it("should reject negative elapsedSeconds", () => {
      expect(
        AnimationStateSchema.safeParse({ ...validState, elapsedSeconds: -1 })
          .success,
      ).toBe(false);
    });

    it("should reject missing animationId", () => {
      const { animationId: _, ...without } = validState;
      expect(AnimationStateSchema.safeParse(without).success).toBe(false);
    });

    it("should reject invalid loopMode", () => {
      expect(
        AnimationStateSchema.safeParse({ ...validState, loopMode: "reverse" })
          .success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// CameraTrackingConfigSchema
// ---------------------------------------------------------------------------
describe("CameraTrackingConfigSchema", () => {
  describe("Happy paths", () => {
    it("should accept required animationId", () => {
      expect(
        CameraTrackingConfigSchema.safeParse({ animationId: "anim-001" })
          .success,
      ).toBe(true);
    });

    it("should accept config with all fields", () => {
      expect(
        CameraTrackingConfigSchema.safeParse({
          animationId: "anim-001",
          range: 500,
          pitch: -30,
          heading: 45,
        }).success,
      ).toBe(true);
    });

    it("should apply default range of 1000", () => {
      const result = CameraTrackingConfigSchema.safeParse({
        animationId: "anim-001",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.range).toBe(1000);
      }
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing animationId", () => {
      expect(CameraTrackingConfigSchema.safeParse({}).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// PathUpdateConfigSchema
// ---------------------------------------------------------------------------
describe("PathUpdateConfigSchema", () => {
  describe("Happy paths", () => {
    it("should accept required animationId only", () => {
      expect(
        PathUpdateConfigSchema.safeParse({ animationId: "anim-001" }).success,
      ).toBe(true);
    });

    it("should accept full path update config", () => {
      expect(
        PathUpdateConfigSchema.safeParse({
          animationId: "anim-001",
          leadTime: 60,
          trailTime: 120,
          width: 4,
          color: { red: 0, green: 1, blue: 0 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing animationId", () => {
      expect(PathUpdateConfigSchema.safeParse({ leadTime: 60 }).success).toBe(
        false,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationControlInputSchema
// ---------------------------------------------------------------------------
describe("AnimationControlInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept play action", () => {
      expect(
        AnimationControlInputSchema.safeParse({
          animationId: "anim-001",
          action: "play",
        }).success,
      ).toBe(true);
    });

    it("should accept pause action", () => {
      expect(
        AnimationControlInputSchema.safeParse({
          animationId: "anim-001",
          action: "pause",
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject invalid action", () => {
      expect(
        AnimationControlInputSchema.safeParse({
          animationId: "anim-001",
          action: "stop",
        }).success,
      ).toBe(false);
    });

    it("should reject missing animationId", () => {
      expect(
        AnimationControlInputSchema.safeParse({ action: "play" }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationRemoveInputSchema
// ---------------------------------------------------------------------------
describe("AnimationRemoveInputSchema", () => {
  it("should accept valid animationId", () => {
    expect(
      AnimationRemoveInputSchema.safeParse({ animationId: "anim-001" }).success,
    ).toBe(true);
  });

  it("should reject missing animationId", () => {
    expect(AnimationRemoveInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationCameraTrackingInputSchema
// ---------------------------------------------------------------------------
describe("AnimationCameraTrackingInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept track=true with animationId", () => {
      expect(
        AnimationCameraTrackingInputSchema.safeParse({
          track: true,
          animationId: "anim-001",
        }).success,
      ).toBe(true);
    });

    it("should accept track=false with animationId", () => {
      expect(
        AnimationCameraTrackingInputSchema.safeParse({
          track: false,
          animationId: "anim-001",
        }).success,
      ).toBe(true);
    });

    it("should accept optional range, pitch, heading", () => {
      expect(
        AnimationCameraTrackingInputSchema.safeParse({
          track: true,
          animationId: "anim-001",
          range: 500,
          pitch: -45,
          heading: 90,
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing track", () => {
      expect(
        AnimationCameraTrackingInputSchema.safeParse({
          animationId: "anim-001",
        }).success,
      ).toBe(false);
    });

    it("should reject missing animationId", () => {
      expect(
        AnimationCameraTrackingInputSchema.safeParse({ track: true }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ClockConfigureInputSchema
// ---------------------------------------------------------------------------
describe("ClockConfigureInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept empty object (all optional)", () => {
      expect(ClockConfigureInputSchema.safeParse({}).success).toBe(true);
    });

    it("should accept partial clock config", () => {
      expect(
        ClockConfigureInputSchema.safeParse({
          multiplier: 10,
          shouldAnimate: true,
          clockRange: "LOOP_STOP",
        }).success,
      ).toBe(true);
    });

    it("should accept full clock config", () => {
      expect(
        ClockConfigureInputSchema.safeParse({
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          currentTime: "2024-01-01T00:30:00Z",
          multiplier: 5,
          shouldAnimate: false,
          clockRange: "CLAMPED",
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject invalid clockRange", () => {
      expect(
        ClockConfigureInputSchema.safeParse({ clockRange: "INVALID" }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ClockControlInputSchema
// ---------------------------------------------------------------------------
describe("ClockControlInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept configure action with clock", () => {
      expect(
        ClockControlInputSchema.safeParse({
          action: "configure",
          clock: { multiplier: 10 },
        }).success,
      ).toBe(true);
    });

    it("should accept setTime action with currentTime", () => {
      expect(
        ClockControlInputSchema.safeParse({
          action: "setTime",
          currentTime: "2024-01-01T00:00:00Z",
        }).success,
      ).toBe(true);
    });

    it("should accept setMultiplier action", () => {
      expect(
        ClockControlInputSchema.safeParse({
          action: "setMultiplier",
          multiplier: 100,
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject invalid action", () => {
      expect(
        ClockControlInputSchema.safeParse({ action: "reset" }).success,
      ).toBe(false);
    });

    it("should reject missing action", () => {
      expect(ClockControlInputSchema.safeParse({ multiplier: 5 }).success).toBe(
        false,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// ClockSetMultiplierInputSchema
// ---------------------------------------------------------------------------
describe("ClockSetMultiplierInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimum value 0.1", () => {
      expect(
        ClockSetMultiplierInputSchema.safeParse({ multiplier: 0.1 }).success,
      ).toBe(true);
    });

    it("should accept maximum value 100", () => {
      expect(
        ClockSetMultiplierInputSchema.safeParse({ multiplier: 100 }).success,
      ).toBe(true);
    });

    it("should accept typical value", () => {
      expect(
        ClockSetMultiplierInputSchema.safeParse({ multiplier: 10 }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject below minimum (0.05)", () => {
      expect(
        ClockSetMultiplierInputSchema.safeParse({ multiplier: 0.05 }).success,
      ).toBe(false);
    });

    it("should reject above maximum (101)", () => {
      expect(
        ClockSetMultiplierInputSchema.safeParse({ multiplier: 101 }).success,
      ).toBe(false);
    });

    it("should reject missing multiplier", () => {
      expect(ClockSetMultiplierInputSchema.safeParse({}).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// GlobeSetLightingInputSchema
// ---------------------------------------------------------------------------
describe("GlobeSetLightingInputSchema", () => {
  describe("Happy paths", () => {
    it("should accept required enableLighting only", () => {
      expect(
        GlobeSetLightingInputSchema.safeParse({ enableLighting: true }).success,
      ).toBe(true);
    });

    it("should accept full lighting config", () => {
      expect(
        GlobeSetLightingInputSchema.safeParse({
          enableLighting: true,
          enableDynamicAtmosphere: false,
          enableSunLighting: false,
        }).success,
      ).toBe(true);
    });

    it("should apply default enableDynamicAtmosphere of true", () => {
      const result = GlobeSetLightingInputSchema.safeParse({
        enableLighting: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enableDynamicAtmosphere).toBe(true);
      }
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing enableLighting", () => {
      expect(GlobeSetLightingInputSchema.safeParse({}).success).toBe(false);
    });

    it("should reject non-boolean enableLighting", () => {
      expect(
        GlobeSetLightingInputSchema.safeParse({ enableLighting: "yes" })
          .success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationPlayInputSchema
// ---------------------------------------------------------------------------
describe("AnimationPlayInputSchema", () => {
  it("should accept valid animationId", () => {
    expect(
      AnimationPlayInputSchema.safeParse({ animationId: "anim-001" }).success,
    ).toBe(true);
  });

  it("should reject missing animationId", () => {
    expect(AnimationPlayInputSchema.safeParse({}).success).toBe(false);
  });

  it("should reject non-string animationId", () => {
    expect(
      AnimationPlayInputSchema.safeParse({ animationId: 42 }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationPauseInputSchema
// ---------------------------------------------------------------------------
describe("AnimationPauseInputSchema", () => {
  it("should accept valid animationId", () => {
    expect(
      AnimationPauseInputSchema.safeParse({ animationId: "anim-001" }).success,
    ).toBe(true);
  });

  it("should reject missing animationId", () => {
    expect(AnimationPauseInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationListActiveInputSchema
// ---------------------------------------------------------------------------
describe("AnimationListActiveInputSchema", () => {
  it("should accept empty object", () => {
    expect(AnimationListActiveInputSchema.safeParse({}).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AnimationTrackEntityInputSchema
// ---------------------------------------------------------------------------
describe("AnimationTrackEntityInputSchema", () => {
  it("should accept required animationId only", () => {
    expect(
      AnimationTrackEntityInputSchema.safeParse({ animationId: "anim-001" })
        .success,
    ).toBe(true);
  });

  it("should accept all optional fields", () => {
    expect(
      AnimationTrackEntityInputSchema.safeParse({
        animationId: "anim-001",
        range: 500,
        pitch: -30,
        heading: 45,
      }).success,
    ).toBe(true);
  });

  it("should apply default range of 1000", () => {
    const result = AnimationTrackEntityInputSchema.safeParse({
      animationId: "anim-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.range).toBe(1000);
    }
  });

  it("should apply default pitch of -45", () => {
    const result = AnimationTrackEntityInputSchema.safeParse({
      animationId: "anim-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pitch).toBe(-45);
    }
  });

  it("should reject missing animationId", () => {
    expect(AnimationTrackEntityInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationUntrackCameraInputSchema
// ---------------------------------------------------------------------------
describe("AnimationUntrackCameraInputSchema", () => {
  it("should accept empty object", () => {
    expect(AnimationUntrackCameraInputSchema.safeParse({}).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CZMLExportOptionsSchema
// ---------------------------------------------------------------------------
describe("CZMLExportOptionsSchema", () => {
  it("should accept empty object with all defaults", () => {
    expect(CZMLExportOptionsSchema.safeParse({}).success).toBe(true);
  });

  it("should accept animationIds array", () => {
    expect(
      CZMLExportOptionsSchema.safeParse({
        animationIds: ["anim-001", "anim-002"],
      }).success,
    ).toBe(true);
  });

  it("should apply default includeClock of true", () => {
    const result = CZMLExportOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeClock).toBe(true);
    }
  });

  it("should apply default compressed of false", () => {
    const result = CZMLExportOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.compressed).toBe(false);
    }
  });

  it("should accept compressed: true", () => {
    expect(
      CZMLExportOptionsSchema.safeParse({ compressed: true }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ClockSetTimeInputSchema
// ---------------------------------------------------------------------------
describe("ClockSetTimeInputSchema", () => {
  it("should accept valid ISO 8601 time", () => {
    expect(
      ClockSetTimeInputSchema.safeParse({ currentTime: "2024-01-01T12:00:00Z" })
        .success,
    ).toBe(true);
  });

  it("should reject missing currentTime", () => {
    expect(ClockSetTimeInputSchema.safeParse({}).success).toBe(false);
  });

  it("should reject non-string currentTime", () => {
    expect(
      ClockSetTimeInputSchema.safeParse({ currentTime: 12345 }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RouteAnimationConfigSchema
// ---------------------------------------------------------------------------
describe("RouteAnimationConfigSchema", () => {
  it("should accept object with required route field", () => {
    expect(
      RouteAnimationConfigSchema.safeParse({ route: { legs: [] } }).success,
    ).toBe(true);
  });

  it("should accept all optional fields", () => {
    expect(
      RouteAnimationConfigSchema.safeParse({
        route: { legs: [] },
        modelPreset: "cesium_man",
        speedMultiplier: 10,
        showPath: true,
        name: "My Route Anim",
      }).success,
    ).toBe(true);
  });

  it("should reject missing route", () => {
    expect(RouteAnimationConfigSchema.safeParse({}).success).toBe(false);
  });
});
