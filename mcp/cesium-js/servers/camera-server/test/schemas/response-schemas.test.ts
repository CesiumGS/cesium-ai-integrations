import { describe, it, expect } from "vitest";
import {
  StatsSchema,
  ExtendedStatsSchema,
  ViewRectangleSchema,
  CameraOperationResponseSchema,
  CameraFlyToResponseSchema,
  CameraSetViewResponseSchema,
  CameraOrbitResponseSchema,
  CameraGetPositionResponseSchema,
  CameraLookAtTransformResponseSchema,
  CameraControllerOptionsResponseSchema,
} from "../../src/schemas/response-schemas";

describe("StatsSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid stats with responseTime", () => {
      const result = StatsSchema.safeParse({ responseTime: 150 });
      expect(result.success).toBe(true);
    });

    it("should accept responseTime of 0", () => {
      const result = StatsSchema.safeParse({ responseTime: 0 });
      expect(result.success).toBe(true);
    });

    it("should accept large responseTime values", () => {
      const result = StatsSchema.safeParse({ responseTime: 999999 });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing responseTime", () => {
      const result = StatsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject responseTime as string", () => {
      const result = StatsSchema.safeParse({ responseTime: "150" });
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = StatsSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe("ExtendedStatsSchema", () => {
  describe("Happy paths", () => {
    it("should accept stats with only responseTime", () => {
      const result = ExtendedStatsSchema.safeParse({ responseTime: 150 });
      expect(result.success).toBe(true);
    });

    it("should accept stats with responseTime and actualDuration", () => {
      const result = ExtendedStatsSchema.safeParse({
        responseTime: 150,
        actualDuration: 3.5,
      });
      expect(result.success).toBe(true);
    });

    it("should accept actualDuration of 0", () => {
      const result = ExtendedStatsSchema.safeParse({
        responseTime: 100,
        actualDuration: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing responseTime", () => {
      const result = ExtendedStatsSchema.safeParse({ actualDuration: 3 });
      expect(result.success).toBe(false);
    });

    it("should reject actualDuration as string", () => {
      const result = ExtendedStatsSchema.safeParse({
        responseTime: 100,
        actualDuration: "3",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("ViewRectangleSchema", () => {
  describe("Happy paths", () => {
    it("should accept undefined (optional)", () => {
      const result = ViewRectangleSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept valid rectangle", () => {
      const result = ViewRectangleSchema.safeParse({
        west: -180,
        south: -90,
        east: 180,
        north: 90,
      });
      expect(result.success).toBe(true);
    });

    it("should accept typical rectangle values", () => {
      const result = ViewRectangleSchema.safeParse({
        west: -105.5,
        south: 39.5,
        east: -104.5,
        north: 40.5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject rectangle with missing west", () => {
      const result = ViewRectangleSchema.safeParse({
        south: 0,
        east: 0,
        north: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject rectangle with string coordinates", () => {
      const result = ViewRectangleSchema.safeParse({
        west: "-105",
        south: "39",
        east: "-104",
        north: "40",
      });
      expect(result.success).toBe(false);
    });

    it("should reject null when provided", () => {
      const result = ViewRectangleSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraOperationResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid response with all required fields", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: true,
        message: "Operation completed",
        stats: { responseTime: 100 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept response with success false", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: false,
        message: "Operation failed",
        stats: { responseTime: 50 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty message", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: true,
        message: "",
        stats: { responseTime: 0 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing success field", () => {
      const result = CameraOperationResponseSchema.safeParse({
        message: "Test",
        stats: { responseTime: 100 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing message field", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: true,
        stats: { responseTime: 100 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing stats field", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: true,
        message: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("should reject success as string", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: "true",
        message: "Test",
        stats: { responseTime: 100 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject message as number", () => {
      const result = CameraOperationResponseSchema.safeParse({
        success: true,
        message: 123,
        stats: { responseTime: 100 },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraFlyToResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid fly-to response", () => {
      const result = CameraFlyToResponseSchema.safeParse({
        success: true,
        message: "Flight completed",
        stats: { responseTime: 3000, actualDuration: 3 },
        finalPosition: { longitude: -105, latitude: 39, height: 1609 },
        finalOrientation: { heading: 0, pitch: -45, roll: 0 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept response with stats without actualDuration", () => {
      const result = CameraFlyToResponseSchema.safeParse({
        success: true,
        message: "Flight completed",
        stats: { responseTime: 100 },
        finalPosition: { longitude: 0, latitude: 0, height: 0 },
        finalOrientation: { heading: 0, pitch: 0, roll: 0 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing finalPosition", () => {
      const result = CameraFlyToResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 100 },
        finalOrientation: { heading: 0, pitch: 0, roll: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing finalOrientation", () => {
      const result = CameraFlyToResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 100 },
        finalPosition: { longitude: 0, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid finalPosition", () => {
      const result = CameraFlyToResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 100 },
        finalPosition: { longitude: 200, latitude: 0, height: 0 },
        finalOrientation: { heading: 0, pitch: 0, roll: 0 },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraSetViewResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid set-view response", () => {
      const result = CameraSetViewResponseSchema.safeParse({
        success: true,
        message: "View set",
        stats: { responseTime: 50 },
        position: { longitude: -105, latitude: 39, height: 1609 },
        orientation: { heading: 90, pitch: -30, roll: 0 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing position", () => {
      const result = CameraSetViewResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing orientation", () => {
      const result = CameraSetViewResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
        position: { longitude: 0, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraOrbitResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept orbit response with all fields", () => {
      const result = CameraOrbitResponseSchema.safeParse({
        success: true,
        message: "Orbit started",
        stats: { responseTime: 50 },
        orbitActive: true,
        speed: 0.005,
        direction: "counterclockwise",
      });
      expect(result.success).toBe(true);
    });

    it("should accept orbit response without optional fields", () => {
      const result = CameraOrbitResponseSchema.safeParse({
        success: true,
        message: "Orbit stopped",
        stats: { responseTime: 30 },
        orbitActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing orbitActive", () => {
      const result = CameraOrbitResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject orbitActive as string", () => {
      const result = CameraOrbitResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
        orbitActive: "true",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraGetPositionResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept full position response", () => {
      const result = CameraGetPositionResponseSchema.safeParse({
        success: true,
        message: "Position retrieved",
        stats: { responseTime: 20 },
        position: { longitude: -105, latitude: 39, height: 1609 },
        orientation: { heading: 0, pitch: -45, roll: 0 },
        viewRectangle: { west: -106, south: 38, east: -104, north: 40 },
        altitude: 1609,
        timestamp: "2026-02-27T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("should accept position response without viewRectangle", () => {
      const result = CameraGetPositionResponseSchema.safeParse({
        success: true,
        message: "Position retrieved",
        stats: { responseTime: 20 },
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
        altitude: 0,
        timestamp: "2026-02-27T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing altitude", () => {
      const result = CameraGetPositionResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 20 },
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
        timestamp: "2026-02-27T12:00:00Z",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing timestamp", () => {
      const result = CameraGetPositionResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 20 },
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
        altitude: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject altitude as string", () => {
      const result = CameraGetPositionResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 20 },
        position: { longitude: 0, latitude: 0, height: 0 },
        orientation: { heading: 0, pitch: 0, roll: 0 },
        altitude: "1609",
        timestamp: "2026-02-27T12:00:00Z",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraLookAtTransformResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept valid look-at-transform response", () => {
      const result = CameraLookAtTransformResponseSchema.safeParse({
        success: true,
        message: "Look-at set",
        stats: { responseTime: 50 },
        target: { longitude: -105, latitude: 39, height: 1609 },
        offset: { heading: 45, pitch: -30, range: 5000 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing target", () => {
      const result = CameraLookAtTransformResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
        offset: { heading: 0, pitch: 0, range: 1000 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing offset", () => {
      const result = CameraLookAtTransformResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
        target: { longitude: 0, latitude: 0, height: 0 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative range in offset", () => {
      const result = CameraLookAtTransformResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 50 },
        target: { longitude: 0, latitude: 0, height: 0 },
        offset: { heading: 0, pitch: 0, range: -100 },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("CameraControllerOptionsResponseSchema", () => {
  describe("Happy paths", () => {
    it("should accept full controller options response", () => {
      const result = CameraControllerOptionsResponseSchema.safeParse({
        success: true,
        message: "Options set",
        stats: { responseTime: 40 },
        settings: {
          enableCollisionDetection: true,
          minimumZoomDistance: 10,
          maximumZoomDistance: 50000,
          enableTilt: true,
          enableRotate: true,
          enableTranslate: true,
          enableZoom: true,
          enableLook: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept settings without optional zoom distances", () => {
      const result = CameraControllerOptionsResponseSchema.safeParse({
        success: true,
        message: "Options set",
        stats: { responseTime: 40 },
        settings: {
          enableCollisionDetection: false,
          enableTilt: false,
          enableRotate: false,
          enableTranslate: false,
          enableZoom: false,
          enableLook: false,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Unhappy paths", () => {
    it("should reject missing settings", () => {
      const result = CameraControllerOptionsResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 40 },
      });
      expect(result.success).toBe(false);
    });

    it("should reject settings with missing required boolean", () => {
      const result = CameraControllerOptionsResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 40 },
        settings: {
          enableCollisionDetection: true,
          enableTilt: true,
          enableRotate: true,
          enableTranslate: true,
          enableZoom: true,
          // missing enableLook
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject settings with boolean as string", () => {
      const result = CameraControllerOptionsResponseSchema.safeParse({
        success: true,
        message: "Test",
        stats: { responseTime: 40 },
        settings: {
          enableCollisionDetection: "true",
          enableTilt: true,
          enableRotate: true,
          enableTranslate: true,
          enableZoom: true,
          enableLook: true,
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
