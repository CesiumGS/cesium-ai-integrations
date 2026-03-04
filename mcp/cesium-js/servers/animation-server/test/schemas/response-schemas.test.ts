import { describe, it, expect } from "vitest";
import {
  ResponseStatsSchema,
  AnimationCreateResponseSchema,
  AnimationStateResponseSchema,
  AnimationInfoSchema,
  AnimationListResponseSchema,
  AnimationListActiveResponseSchema,
  CameraTrackingResponseSchema,
  CZMLExportResponseSchema,
  GenericAnimationResponseSchema,
  ClockResponseSchema,
} from "../../src/schemas/response-schemas";

// ---------------------------------------------------------------------------
// ResponseStatsSchema
// ---------------------------------------------------------------------------
describe("ResponseStatsSchema", () => {
  it("should accept required responseTime only", () => {
    expect(ResponseStatsSchema.safeParse({ responseTime: 42 }).success).toBe(
      true,
    );
  });

  it("should accept all optional fields", () => {
    expect(
      ResponseStatsSchema.safeParse({
        responseTime: 10,
        totalAnimations: 3,
        activeAnimations: 2,
        entityCount: 5,
        documentSize: 1024,
      }).success,
    ).toBe(true);
  });

  it("should reject missing responseTime", () => {
    expect(ResponseStatsSchema.safeParse({}).success).toBe(false);
  });

  it("should reject string responseTime", () => {
    expect(
      ResponseStatsSchema.safeParse({ responseTime: "10ms" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationCreateResponseSchema
// ---------------------------------------------------------------------------
describe("AnimationCreateResponseSchema", () => {
  const valid = {
    success: true,
    message: "Animation created",
    animationId: "anim-001",
    startTime: "2024-01-01T00:00:00Z",
    stopTime: "2024-01-01T01:00:00Z",
  };

  describe("Happy paths", () => {
    it("should accept minimal valid response", () => {
      expect(AnimationCreateResponseSchema.safeParse(valid).success).toBe(true);
    });

    it("should accept response with optional fields", () => {
      expect(
        AnimationCreateResponseSchema.safeParse({
          ...valid,
          modelPreset: "cesium_man",
          stats: { responseTime: 100 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing animationId", () => {
      const { animationId: _, ...without } = valid;
      expect(AnimationCreateResponseSchema.safeParse(without).success).toBe(
        false,
      );
    });

    it("should reject non-boolean success", () => {
      expect(
        AnimationCreateResponseSchema.safeParse({ ...valid, success: "yes" })
          .success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationListActiveResponseSchema
// ---------------------------------------------------------------------------
describe("AnimationListActiveResponseSchema", () => {
  const validAnim = {
    animationId: "anim-001",
    isAnimating: true,
    startTime: "2024-01-01T00:00:00Z",
    stopTime: "2024-01-01T01:00:00Z",
    clockMultiplier: 1,
  };

  describe("Happy paths", () => {
    it("should accept valid list response with empty animations", () => {
      expect(
        AnimationListActiveResponseSchema.safeParse({
          success: true,
          message: "Found 0 animations",
          animations: [],
          stats: { totalAnimations: 0, responseTime: 10 },
        }).success,
      ).toBe(true);
    });

    it("should accept list response with animations", () => {
      expect(
        AnimationListActiveResponseSchema.safeParse({
          success: true,
          message: "Found 1 animation",
          animations: [validAnim],
          stats: { totalAnimations: 1, responseTime: 15 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing stats", () => {
      expect(
        AnimationListActiveResponseSchema.safeParse({
          success: true,
          message: "ok",
          animations: [],
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// CameraTrackingResponseSchema
// ---------------------------------------------------------------------------
describe("CameraTrackingResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept tracking enabled response", () => {
      expect(
        CameraTrackingResponseSchema.safeParse({
          success: true,
          message: "Tracking enabled",
          isTracking: true,
          trackedAnimationId: "anim-001",
          stats: { responseTime: 5 },
        }).success,
      ).toBe(true);
    });

    it("should accept tracking disabled response (no trackedAnimationId)", () => {
      expect(
        CameraTrackingResponseSchema.safeParse({
          success: true,
          message: "Tracking disabled",
          isTracking: false,
          stats: { responseTime: 5 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing isTracking", () => {
      expect(
        CameraTrackingResponseSchema.safeParse({
          success: true,
          message: "ok",
          stats: { responseTime: 5 },
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// GenericAnimationResponseSchema
// ---------------------------------------------------------------------------
describe("GenericAnimationResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal valid response", () => {
      expect(
        GenericAnimationResponseSchema.safeParse({
          success: true,
          message: "Operation complete",
          stats: { responseTime: 10 },
        }).success,
      ).toBe(true);
    });

    it("should accept response with optional animationId", () => {
      expect(
        GenericAnimationResponseSchema.safeParse({
          success: false,
          message: "Failed",
          animationId: "anim-001",
          stats: { responseTime: 0 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing message", () => {
      expect(
        GenericAnimationResponseSchema.safeParse({
          success: true,
          stats: { responseTime: 10 },
        }).success,
      ).toBe(false);
    });

    it("should reject missing stats", () => {
      expect(
        GenericAnimationResponseSchema.safeParse({
          success: true,
          message: "ok",
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// ClockResponseSchema
// ---------------------------------------------------------------------------
describe("ClockResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept minimal clock response", () => {
      expect(
        ClockResponseSchema.safeParse({
          success: true,
          message: "Clock updated",
          stats: { responseTime: 5 },
        }).success,
      ).toBe(true);
    });

    it("should accept response with clockState", () => {
      expect(
        ClockResponseSchema.safeParse({
          success: true,
          message: "Clock configured",
          clockState: { multiplier: 10, shouldAnimate: true },
          stats: { responseTime: 5 },
        }).success,
      ).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing success", () => {
      expect(
        ClockResponseSchema.safeParse({
          message: "ok",
          stats: { responseTime: 5 },
        }).success,
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AnimationStateResponseSchema
// ---------------------------------------------------------------------------
const validAnimState = {
  animationId: "anim-001",
  isAnimating: true,
  currentTime: "2024-01-01T00:00:00Z",
  startTime: "2024-01-01T00:00:00Z",
  stopTime: "2024-01-01T01:00:00Z",
  progress: 0.5,
  elapsedSeconds: 1800,
  remainingSeconds: 1800,
  clockMultiplier: 1,
  loopMode: "none",
  hasModel: true,
  hasPath: true,
};

describe("AnimationStateResponseSchema", () => {
  it("should accept valid state response with animationState", () => {
    expect(
      AnimationStateResponseSchema.safeParse({
        success: true,
        message: "State retrieved",
        animationState: validAnimState,
        stats: { responseTime: 5 },
      }).success,
    ).toBe(true);
  });

  it("should accept state response without animationState", () => {
    expect(
      AnimationStateResponseSchema.safeParse({
        success: true,
        message: "No animation",
        stats: { responseTime: 5 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing stats", () => {
    expect(
      AnimationStateResponseSchema.safeParse({
        success: true,
        message: "ok",
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationInfoSchema
// ---------------------------------------------------------------------------
describe("AnimationInfoSchema", () => {
  const valid = {
    animationId: "anim-001",
    isAnimating: false,
    startTime: "2024-01-01T00:00:00Z",
    stopTime: "2024-01-01T01:00:00Z",
    clockMultiplier: 2,
  };

  it("should accept minimal valid animation info", () => {
    expect(AnimationInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("should accept animation info with optional name", () => {
    expect(
      AnimationInfoSchema.safeParse({ ...valid, name: "My Anim" }).success,
    ).toBe(true);
  });

  it("should reject missing animationId", () => {
    const { animationId: _, ...without } = valid;
    expect(AnimationInfoSchema.safeParse(without).success).toBe(false);
  });

  it("should reject missing clockMultiplier", () => {
    const { clockMultiplier: _, ...without } = valid;
    expect(AnimationInfoSchema.safeParse(without).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnimationListResponseSchema
// ---------------------------------------------------------------------------
describe("AnimationListResponseSchema", () => {
  const validListResponse = {
    success: true,
    message: "Found 1 animation",
    animations: [validAnimState],
    clockState: { multiplier: 1 },
    stats: { totalAnimations: 1, activeAnimations: 1, responseTime: 10 },
  };

  it("should accept valid list response", () => {
    expect(
      AnimationListResponseSchema.safeParse(validListResponse).success,
    ).toBe(true);
  });

  it("should accept empty animations array", () => {
    expect(
      AnimationListResponseSchema.safeParse({
        ...validListResponse,
        animations: [],
        stats: { totalAnimations: 0, activeAnimations: 0, responseTime: 5 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing clockState", () => {
    const { clockState: _, ...without } = validListResponse;
    expect(AnimationListResponseSchema.safeParse(without).success).toBe(false);
  });

  it("should reject missing stats", () => {
    const { stats: _, ...without } = validListResponse;
    expect(AnimationListResponseSchema.safeParse(without).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CZMLExportResponseSchema
// ---------------------------------------------------------------------------
describe("CZMLExportResponseSchema", () => {
  const valid = {
    success: true,
    message: "Exported 1 animation",
    czml: '[{"id":"document"}]',
    stats: { entityCount: 1, documentSize: 1024, responseTime: 50 },
  };

  it("should accept valid CZML export response", () => {
    expect(CZMLExportResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("should reject missing czml field", () => {
    const { czml: _, ...without } = valid;
    expect(CZMLExportResponseSchema.safeParse(without).success).toBe(false);
  });

  it("should reject missing stats", () => {
    const { stats: _, ...without } = valid;
    expect(CZMLExportResponseSchema.safeParse(without).success).toBe(false);
  });

  it("should reject non-string czml", () => {
    expect(
      CZMLExportResponseSchema.safeParse({ ...valid, czml: 42 }).success,
    ).toBe(false);
  });
});
