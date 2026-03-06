/**
 * Unit Tests for Animation Manager
 * Tests all command handler functions for clock, animation, camera tracking, and globe lighting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import CesiumAnimationManager from "../../src/managers/animation-manager";
import type { CesiumViewer } from "../../src/types/cesium-types";
import type {
  MCPCommand,
  ClockConfig,
  PositionSample,
} from "../../src/types/mcp";
import * as cesiumUtils from "../../src/shared/cesium-utils";
import * as entityUtils from "../../src/shared/entity-utils";
import * as cameraUtils from "../../src/shared/camera-utils";

// ---- Module mocks ----

vi.mock("../../src/shared/cesium-utils", () => ({
  parseJulianDate: vi.fn((_date: unknown) => ({
    dayNumber: 2451545,
    secondsOfDay: 0,
  })),
  formatJulianDate: vi.fn((_jd: unknown) => "2000-01-01T12:00:00Z"),
  parseClockRange: vi.fn((_range: unknown) => 1),
  parseClockStep: vi.fn((_step: unknown) => 0),
  positionToCartesian3: vi.fn((_pos: unknown) => ({ x: 1, y: 2, z: 3 })),
  createHeadingPitchRange: vi.fn((h: number, p: number, r: number) => ({
    heading: h,
    pitch: p,
    range: r,
  })),
  parseColor: vi.fn((_color: unknown, _default: unknown) => ({
    r: 0,
    g: 1,
    b: 0,
    a: 1,
  })),
  setClockMultiplier: vi.fn(),
  setClockShouldAnimate: vi.fn(),
  setClockCurrentTime: vi.fn(),
  configureClockTimes: vi.fn(
    (_viewer: unknown, _start: unknown, _stop: unknown) => ({
      start: { dayNumber: 2451545, secondsOfDay: 0 },
      stop: { dayNumber: 2451546, secondsOfDay: 0 },
    }),
  ),
  updateTimeline: vi.fn(),
  decimateArray: vi.fn(<T>(arr: T[], _max: number): T[] => arr),
}));

vi.mock("../../src/shared/entity-utils", () => ({
  removeEntityById: vi.fn(() => true),
  addAnimatedModelEntity: vi.fn(() => ({
    id: "anim-entity-1",
    name: "Animation Entity",
    model: { uri: "model.glb" },
    position: {
      getValue: vi.fn(() => ({ x: 1000, y: 2000, z: 3000 })),
    },
  })),
}));

vi.mock("../../src/shared/camera-utils", () => ({
  resetCameraTransform: vi.fn(),
}));

// ---- Helpers ----

function makeSamples(count = 3): PositionSample[] {
  return Array.from({ length: count }, (_, i) => ({
    longitude: -105 + i * 0.1,
    latitude: 39 + i * 0.1,
    height: 1000 + i * 100,
    time: `2024-01-01T00:0${i}:00Z`,
  }));
}

// ---- Tests ----

describe("Animation Manager Unit Tests", () => {
  let animationManager: CesiumAnimationManager;
  let mockViewer: CesiumViewer;
  let commandHandlers: Map<string, (cmd: MCPCommand) => unknown>;

  beforeEach(() => {
    // Wrap specific constructors with vi.fn() for call tracking
    // Note: cesium-mock.ts already provides all base implementations
    const existingCesium = (globalThis as unknown as Record<string, unknown>)
      .Cesium as Record<string, unknown>;

    // Store original implementations
    const OriginalSampledPositionProperty =
      existingCesium.SampledPositionProperty;
    const OriginalConstantProperty = existingCesium.ConstantProperty;
    const OriginalPolylineGlowMaterialProperty =
      existingCesium.PolylineGlowMaterialProperty;

    // Wrap constructors that need call tracking
    (globalThis as unknown as Record<string, unknown>).Cesium = {
      ...existingCesium,
      SampledPositionProperty: vi.fn(function (
        this: unknown,
        ...args: unknown[]
      ) {
        return new (OriginalSampledPositionProperty as new (
          ...args: unknown[]
        ) => unknown)(...args);
      }),
      ConstantProperty: vi.fn(function (this: unknown, ...args: unknown[]) {
        return new (OriginalConstantProperty as new (
          ...args: unknown[]
        ) => unknown)(...args);
      }),
      PolylineGlowMaterialProperty: vi.fn(function (
        this: unknown,
        ...args: unknown[]
      ) {
        return new (OriginalPolylineGlowMaterialProperty as new (
          ...args: unknown[]
        ) => unknown)(...args);
      }),
    };

    // Clear all mocks between tests
    vi.clearAllMocks();

    mockViewer = {
      clock: {
        startTime: null,
        stopTime: null,
        currentTime: null,
        clockRange: null,
        clockStep: null,
        multiplier: 1,
        shouldAnimate: false,
      },
      entities: {
        getById: vi.fn(),
        remove: vi.fn(),
      },
      trackedEntity: undefined as unknown,
      scene: {
        globe: {
          enableLighting: false,
          showGroundAtmosphere: false,
          dynamicAtmosphereLighting: false,
          dynamicAtmosphereLightingFromSun: false,
        },
        atmosphere: {
          dynamicLighting: null as unknown,
        },
      },
      camera: {
        lookAt: vi.fn(),
      },
    } as unknown as CesiumViewer;

    animationManager = new CesiumAnimationManager(mockViewer);
    commandHandlers = animationManager.getCommandHandlers() as Map<
      string,
      (cmd: MCPCommand) => unknown
    >;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // setUp
  // ───────────────────────────────────────────────────────────────────────────

  describe("setUp", () => {
    it("should call setClockShouldAnimate with true", () => {
      animationManager.setUp();
      expect(cesiumUtils.setClockShouldAnimate).toHaveBeenCalledWith(
        mockViewer,
        true,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // clock_control
  // ───────────────────────────────────────────────────────────────────────────

  describe("clock_control handler", () => {
    const handler = () => commandHandlers.get("clock_control")!;

    it("should register the clock_control handler", () => {
      expect(commandHandlers.has("clock_control")).toBe(true);
      expect(typeof commandHandlers.get("clock_control")).toBe("function");
    });

    describe("action: configure", () => {
      it("should configure clock with all parameters", () => {
        const clockConfig: ClockConfig = {
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          currentTime: "2024-01-01T00:00:00Z",
          clockRange: "LOOP_STOP",
          clockStep: "SYSTEM_CLOCK_MULTIPLIER",
          multiplier: 10,
          shouldAnimate: true,
        };

        const cmd: MCPCommand = {
          type: "clock_control",
          action: "configure",
          clock: clockConfig,
        };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toContain("Clock configured");
        expect(cesiumUtils.parseJulianDate).toHaveBeenCalledTimes(3);
        expect(cesiumUtils.parseClockRange).toHaveBeenCalledWith(
          clockConfig.clockRange,
        );
        expect(cesiumUtils.parseClockStep).toHaveBeenCalledWith(
          clockConfig.clockStep,
        );
        expect(cesiumUtils.setClockMultiplier).toHaveBeenCalledWith(
          mockViewer,
          10,
        );
        expect(cesiumUtils.setClockShouldAnimate).toHaveBeenCalledWith(
          mockViewer,
          true,
        );
        expect(cesiumUtils.updateTimeline).toHaveBeenCalled();
      });

      it("should configure clock without optional multiplier and shouldAnimate", () => {
        const clockConfig: ClockConfig = {
          startTime: "2024-01-01T00:00:00Z",
          stopTime: "2024-01-01T01:00:00Z",
          currentTime: "2024-01-01T00:00:00Z",
          clockRange: "LOOP_STOP",
        };

        const cmd: MCPCommand = {
          type: "clock_control",
          action: "configure",
          clock: clockConfig,
        };
        const result = handler()(cmd) as { success: boolean };

        expect(result.success).toBe(true);
        expect(cesiumUtils.setClockMultiplier).not.toHaveBeenCalled();
        expect(cesiumUtils.setClockShouldAnimate).not.toHaveBeenCalled();
      });

      it("should return error when parseJulianDate throws", () => {
        vi.mocked(cesiumUtils.parseJulianDate).mockImplementationOnce(() => {
          throw new Error("Invalid date");
        });

        const cmd: MCPCommand = {
          type: "clock_control",
          action: "configure",
          clock: {
            startTime: "INVALID",
            stopTime: "2024-01-01T01:00:00Z",
            currentTime: "2024-01-01T00:00:00Z",
          } as ClockConfig,
        };
        const result = handler()(cmd) as { success: boolean; error: string };

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid date");
      });
    });

    describe("action: setTime", () => {
      it("should set the current clock time", () => {
        const cmd: MCPCommand = {
          type: "clock_control",
          action: "setTime",
          currentTime: "2024-06-15T12:00:00Z",
        };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toContain("Clock time set");
        expect(cesiumUtils.setClockCurrentTime).toHaveBeenCalledWith(
          mockViewer,
          "2024-06-15T12:00:00Z",
        );
      });

      it("should return error when setClockCurrentTime throws", () => {
        vi.mocked(cesiumUtils.setClockCurrentTime).mockImplementationOnce(
          () => {
            throw new Error("Clock error");
          },
        );

        const cmd: MCPCommand = {
          type: "clock_control",
          action: "setTime",
          currentTime: "BAD",
        };
        const result = handler()(cmd) as { success: boolean; error: string };

        expect(result.success).toBe(false);
        expect(result.error).toContain("Clock error");
      });
    });

    describe("action: setMultiplier", () => {
      it("should set the clock multiplier", () => {
        const cmd: MCPCommand = {
          type: "clock_control",
          action: "setMultiplier",
          multiplier: 50,
        };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toContain("50x real time");
        expect(cesiumUtils.setClockMultiplier).toHaveBeenCalledWith(
          mockViewer,
          50,
        );
      });

      it("should accept multiplier of 1 (real-time)", () => {
        const cmd: MCPCommand = {
          type: "clock_control",
          action: "setMultiplier",
          multiplier: 1,
        };
        const result = handler()(cmd) as { success: boolean };

        expect(result.success).toBe(true);
        expect(cesiumUtils.setClockMultiplier).toHaveBeenCalledWith(
          mockViewer,
          1,
        );
      });
    });

    describe("unknown action", () => {
      it("should return error for unknown clock action", () => {
        const cmd: MCPCommand = { type: "clock_control", action: "rewind" };
        const result = handler()(cmd) as { success: boolean; error: string };

        expect(result.success).toBe(false);
        expect(result.error).toContain("Unknown clock action: rewind");
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // animation_create
  // ───────────────────────────────────────────────────────────────────────────

  describe("animation_create handler", () => {
    const handler = () => commandHandlers.get("animation_create")!;

    it("should register the animation_create handler", () => {
      expect(commandHandlers.has("animation_create")).toBe(true);
    });

    it("should create an animation with required parameters", () => {
      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "route-1",
        positionSamples: makeSamples(3),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "Assets/Models/plane.glb",
        showPath: true,
        speedMultiplier: 20,
        autoPlay: false,
        trackCamera: false,
      };

      const result = handler()(cmd) as { success: boolean; message: string };

      expect(result.success).toBe(true);
      expect(result.message).toContain("Animation created");
      expect(entityUtils.addAnimatedModelEntity).toHaveBeenCalledOnce();
    });

    it("should enable autoPlay when autoPlay is true", () => {
      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "route-autoplay",
        positionSamples: makeSamples(2),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "Assets/Models/plane.glb",
        speedMultiplier: 10,
        autoPlay: true,
        trackCamera: false,
      };

      const result = handler()(cmd) as { success: boolean };

      expect(result.success).toBe(true);
      expect(cesiumUtils.setClockShouldAnimate).toHaveBeenCalledWith(
        mockViewer,
        true,
      );
    });

    it("should set trackedEntity when trackCamera is true", () => {
      const mockEntity = {
        id: "route-track",
        model: { uri: "model.glb" },
        position: { getValue: vi.fn(() => ({ x: 0, y: 0, z: 0 })) },
      };
      vi.mocked(entityUtils.addAnimatedModelEntity).mockReturnValueOnce(
        mockEntity as unknown as ReturnType<
          typeof entityUtils.addAnimatedModelEntity
        >,
      );

      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "route-track",
        positionSamples: makeSamples(2),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "Assets/Models/plane.glb",
        speedMultiplier: 10,
        autoPlay: false,
        trackCamera: true,
      };

      handler()(cmd);

      expect(mockViewer.trackedEntity).toBe(mockEntity);
    });

    it("should store animation state in internal map", () => {
      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "stored-anim",
        positionSamples: makeSamples(2),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "Assets/Models/plane.glb",
        speedMultiplier: 10,
        autoPlay: false,
        trackCamera: false,
      };

      handler()(cmd);

      // Verify the animation appears in the active list
      const listHandler = commandHandlers.get("animation_list_active")!;
      const listResult = listHandler({} as MCPCommand) as {
        success: boolean;
        animations: { animationId: string }[];
      };
      expect(listResult.success).toBe(true);
      expect(
        listResult.animations.some((a) => a.animationId === "stored-anim"),
      ).toBe(true);
    });

    it("should call decimateArray on position samples", () => {
      const samples = makeSamples(5);
      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "decimate-test",
        positionSamples: samples,
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "model.glb",
        speedMultiplier: 1,
        autoPlay: false,
        trackCamera: false,
      };

      handler()(cmd);

      expect(cesiumUtils.decimateArray).toHaveBeenCalledWith(samples, 500);
    });

    it("should return error when modelUri is missing", () => {
      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "no-model",
        positionSamples: makeSamples(2),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        // modelUri is intentionally omitted
        speedMultiplier: 10,
        autoPlay: false,
        trackCamera: false,
      };

      const result = handler()(cmd) as { success: boolean; error: string };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Model URI is required");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // animation_control
  // ───────────────────────────────────────────────────────────────────────────

  describe("animation_control handler", () => {
    const handler = () => commandHandlers.get("animation_control")!;

    it("should register the animation_control handler", () => {
      expect(commandHandlers.has("animation_control")).toBe(true);
    });

    describe("action: play", () => {
      it("should play the animation", () => {
        const cmd: MCPCommand = { type: "animation_control", action: "play" };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toBe("Animation playing");
        expect(cesiumUtils.setClockShouldAnimate).toHaveBeenCalledWith(
          mockViewer,
          true,
        );
      });
    });

    describe("action: pause", () => {
      it("should pause the animation", () => {
        const cmd: MCPCommand = { type: "animation_control", action: "pause" };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toBe("Animation paused");
        expect(cesiumUtils.setClockShouldAnimate).toHaveBeenCalledWith(
          mockViewer,
          false,
        );
      });
    });

    describe("unknown action", () => {
      it("should return error for unknown animation action", () => {
        const cmd: MCPCommand = { type: "animation_control", action: "stop" };
        const result = handler()(cmd) as { success: boolean; error: string };

        expect(result.success).toBe(false);
        expect(result.error).toContain("Unknown animation action: stop");
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // animation_remove
  // ───────────────────────────────────────────────────────────────────────────

  describe("animation_remove handler", () => {
    const handler = () => commandHandlers.get("animation_remove")!;

    it("should register the animation_remove handler", () => {
      expect(commandHandlers.has("animation_remove")).toBe(true);
    });

    it("should remove an existing animation and entity", () => {
      const mockEntity = { id: "anim-to-remove", name: "Animation" };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(mockEntity);

      const cmd: MCPCommand = {
        type: "animation_remove",
        animationId: "anim-to-remove",
      };
      const result = handler()(cmd) as { success: boolean; message: string };

      expect(result.success).toBe(true);
      expect(result.message).toContain("anim-to-remove");
      expect(entityUtils.removeEntityById).toHaveBeenCalledWith(
        mockViewer,
        "anim-to-remove",
      );
    });

    it("should clean up state when entity does not exist in viewer", () => {
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(undefined);

      const cmd: MCPCommand = {
        type: "animation_remove",
        animationId: "ghost-anim",
      };
      const result = handler()(cmd) as { success: boolean; message: string };

      expect(result.success).toBe(true);
      expect(entityUtils.removeEntityById).not.toHaveBeenCalled();
    });

    it("should untrack camera if the removed animation was tracked", () => {
      const mockEntity = { id: "tracked-anim", name: "Tracked Animation" };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(mockEntity);
      mockViewer.trackedEntity =
        mockEntity as unknown as CesiumViewer["trackedEntity"];

      const cmd: MCPCommand = {
        type: "animation_remove",
        animationId: "tracked-anim",
      };
      handler()(cmd);

      expect(mockViewer.trackedEntity).toBeUndefined();
    });

    it("should not untrack camera for a different tracked entity", () => {
      const differentEntity = { id: "other-entity", name: "Other" };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue({ id: "some-anim" });
      mockViewer.trackedEntity =
        differentEntity as unknown as CesiumViewer["trackedEntity"];

      const cmd: MCPCommand = {
        type: "animation_remove",
        animationId: "some-anim",
      };
      handler()(cmd);

      // different entity is still tracked
      expect(mockViewer.trackedEntity).toBe(differentEntity);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // animation_update_path
  // ───────────────────────────────────────────────────────────────────────────

  describe("animation_update_path handler", () => {
    const handler = () => commandHandlers.get("animation_update_path")!;

    it("should register the animation_update_path handler", () => {
      expect(commandHandlers.has("animation_update_path")).toBe(true);
    });

    it("should update path properties for an existing entity", () => {
      const mockPath = {
        leadTime: null as unknown,
        trailTime: null as unknown,
        width: null as unknown,
        material: null as unknown,
      };
      const mockEntity = { id: "path-anim", path: mockPath };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(mockEntity);

      const cmd: MCPCommand = {
        type: "animation_update_path",
        animationId: "path-anim",
        leadTime: 30,
        trailTime: 120,
        width: 5,
        color: "blue",
      };
      const result = handler()(cmd) as { success: boolean; message: string };

      expect(result.success).toBe(true);
      expect(result.message).toBe("Path configuration updated");
      // ConstantProperty should have been called for each property
      const ConstantProperty = (
        globalThis as unknown as Record<string, unknown>
      ).Cesium as { ConstantProperty: ReturnType<typeof vi.fn> };
      expect(ConstantProperty.ConstantProperty).toHaveBeenCalledWith(30);
      expect(ConstantProperty.ConstantProperty).toHaveBeenCalledWith(120);
      expect(ConstantProperty.ConstantProperty).toHaveBeenCalledWith(5);
      expect(cesiumUtils.parseColor).toHaveBeenCalledWith(
        "blue",
        expect.anything(),
      );
    });

    it("should return error when animation entity is not found", () => {
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(undefined);

      const cmd: MCPCommand = {
        type: "animation_update_path",
        animationId: "missing-anim",
      };
      const result = handler()(cmd) as { success: boolean; error: string };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Animation not found");
    });

    it("should still succeed when entity has no path property", () => {
      const mockEntity = { id: "no-path-entity", path: undefined };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(mockEntity);

      const cmd: MCPCommand = {
        type: "animation_update_path",
        animationId: "no-path-entity",
        leadTime: 10,
      };
      const result = handler()(cmd) as { success: boolean };

      expect(result.success).toBe(true);
    });

    it("should skip undefined optional parameters", () => {
      const mockPath = {
        leadTime: null as unknown,
        trailTime: null as unknown,
        width: null as unknown,
        material: null as unknown,
      };
      const mockEntity = { id: "partial-anim", path: mockPath };
      vi.mocked(
        mockViewer.entities.getById as ReturnType<typeof vi.fn>,
      ).mockReturnValue(mockEntity);

      const cmd: MCPCommand = {
        type: "animation_update_path",
        animationId: "partial-anim",
      };
      const result = handler()(cmd) as { success: boolean };

      expect(result.success).toBe(true);
      // ConstantProperty should not have been called since no values given
      const ConstantProperty = (
        globalThis as unknown as Record<string, unknown>
      ).Cesium as { ConstantProperty: ReturnType<typeof vi.fn> };
      expect(ConstantProperty.ConstantProperty).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // animation_camera_tracking
  // ───────────────────────────────────────────────────────────────────────────

  describe("animation_camera_tracking handler", () => {
    const handler = () => commandHandlers.get("animation_camera_tracking")!;

    it("should register the animation_camera_tracking handler", () => {
      expect(commandHandlers.has("animation_camera_tracking")).toBe(true);
    });

    describe("track = true", () => {
      it("should start tracking an existing animation entity", () => {
        const mockEntity = { id: "track-me", name: "Track Me" };
        vi.mocked(
          mockViewer.entities.getById as ReturnType<typeof vi.fn>,
        ).mockReturnValue(mockEntity);

        const cmd: MCPCommand = {
          type: "animation_camera_tracking",
          animationId: "track-me",
          track: true,
        };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toContain("Tracking animation track-me");
        expect(mockViewer.trackedEntity).toBe(mockEntity);
      });

      it("should return error when the animation entity is not found", () => {
        vi.mocked(
          mockViewer.entities.getById as ReturnType<typeof vi.fn>,
        ).mockReturnValue(undefined);

        const cmd: MCPCommand = {
          type: "animation_camera_tracking",
          animationId: "ghost",
          track: true,
        };
        const result = handler()(cmd) as { success: boolean; error: string };

        expect(result.success).toBe(false);
        expect(result.error).toBe("Animation not found");
      });

      it("should apply camera offset via setTimeout when range/pitch/heading provided", () => {
        vi.useFakeTimers();
        const mockPosition = { x: 100, y: 200, z: 300 };
        const mockEntity = {
          id: "offset-track",
          name: "Offset Track",
          position: { getValue: vi.fn(() => mockPosition) },
        };
        vi.mocked(
          mockViewer.entities.getById as ReturnType<typeof vi.fn>,
        ).mockReturnValue(mockEntity);

        const cmd: MCPCommand = {
          type: "animation_camera_tracking",
          animationId: "offset-track",
          track: true,
          range: 5000,
          pitch: -30,
          heading: 45,
        };
        handler()(cmd);

        // Advance timers to trigger the setTimeout callback
        vi.runAllTimers();

        expect(mockViewer.camera.lookAt).toHaveBeenCalledWith(
          mockPosition,
          expect.objectContaining({ heading: 45, pitch: -30, range: 5000 }),
        );
        vi.useRealTimers();
      });
    });

    describe("track = false", () => {
      it("should untrack the camera", () => {
        const mockEntity = { id: "was-tracked" };
        mockViewer.trackedEntity =
          mockEntity as unknown as CesiumViewer["trackedEntity"];

        const cmd: MCPCommand = {
          type: "animation_camera_tracking",
          track: false,
        };
        const result = handler()(cmd) as { success: boolean; message: string };

        expect(result.success).toBe(true);
        expect(result.message).toBe("Camera untracked");
        expect(mockViewer.trackedEntity).toBeUndefined();
        expect(cameraUtils.resetCameraTransform).toHaveBeenCalledWith(
          mockViewer,
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // animation_list_active
  // ───────────────────────────────────────────────────────────────────────────

  describe("animation_list_active handler", () => {
    const handler = () => commandHandlers.get("animation_list_active")!;

    it("should register the animation_list_active handler", () => {
      expect(commandHandlers.has("animation_list_active")).toBe(true);
    });

    it("should return empty list when no animations are active", () => {
      const result = handler()({} as MCPCommand) as {
        success: boolean;
        animations: unknown[];
        clockState: { multiplier: number; shouldAnimate: boolean };
      };

      expect(result.success).toBe(true);
      expect(result.animations).toHaveLength(0);
      expect(result.clockState).toBeDefined();
      expect(result.clockState.multiplier).toBe(1);
    });

    it("should list all active animations with start/stop times", () => {
      // Create two animations
      const createHandler = commandHandlers.get("animation_create")!;

      const base: Omit<MCPCommand, "animationId"> = {
        type: "animation_create",
        positionSamples: makeSamples(2),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "model.glb",
        speedMultiplier: 10,
        autoPlay: false,
        trackCamera: false,
      };

      createHandler({
        ...base,
        animationId: "anim-A",
      } as unknown as MCPCommand);
      createHandler({
        ...base,
        animationId: "anim-B",
      } as unknown as MCPCommand);

      const result = handler()({} as MCPCommand) as {
        success: boolean;
        animations: { animationId: string }[];
        message: string;
      };

      expect(result.success).toBe(true);
      expect(result.animations).toHaveLength(2);
      const ids = result.animations.map((a) => a.animationId);
      expect(ids).toContain("anim-A");
      expect(ids).toContain("anim-B");
    });

    it("should report clock shouldAnimate state", () => {
      (mockViewer.clock as { shouldAnimate: boolean }).shouldAnimate = true;

      const result = handler()({} as MCPCommand) as {
        clockState: { shouldAnimate: boolean };
      };

      expect(result.clockState.shouldAnimate).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // globe_lighting
  // ───────────────────────────────────────────────────────────────────────────

  describe("globe_lighting handler", () => {
    const handler = () => commandHandlers.get("globe_lighting")!;

    it("should register the globe_lighting handler", () => {
      expect(commandHandlers.has("globe_lighting")).toBe(true);
    });

    it("should enable globe lighting with all options", () => {
      const cmd: MCPCommand = {
        type: "globe_lighting",
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      };
      const result = handler()(cmd) as { success: boolean; message: string };

      expect(result.success).toBe(true);
      expect(mockViewer.scene.globe.enableLighting).toBe(true);
      expect(mockViewer.scene.globe.showGroundAtmosphere).toBe(true);
      expect(mockViewer.scene.globe.dynamicAtmosphereLighting).toBe(true);
      expect(mockViewer.scene.globe.dynamicAtmosphereLightingFromSun).toBe(
        true,
      );
      expect(result.message).toContain("Globe lighting enabled");
    });

    it("should disable globe lighting", () => {
      const cmd: MCPCommand = { type: "globe_lighting", enableLighting: false };
      const result = handler()(cmd) as { success: boolean; message: string };

      expect(result.success).toBe(true);
      expect(mockViewer.scene.globe.enableLighting).toBe(false);
      expect(mockViewer.scene.globe.dynamicAtmosphereLighting).toBe(false);
      expect(mockViewer.scene.globe.dynamicAtmosphereLightingFromSun).toBe(
        false,
      );
      expect(result.message).toBe("Globe lighting disabled");
    });

    it("should set atmosphere dynamicLighting to SUNLIGHT when sun lighting enabled", () => {
      const cmd: MCPCommand = {
        type: "globe_lighting",
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      };
      handler()(cmd);

      expect(mockViewer.scene.atmosphere.dynamicLighting).toBe("SUNLIGHT");
    });

    it("should set atmosphere dynamicLighting to SCENE_LIGHT when sun lighting disabled", () => {
      const cmd: MCPCommand = {
        type: "globe_lighting",
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: false,
      };
      handler()(cmd);

      expect(mockViewer.scene.atmosphere.dynamicLighting).toBe("SCENE_LIGHT");
    });

    it("should set atmosphere dynamicLighting to NONE when lighting disabled", () => {
      const cmd: MCPCommand = { type: "globe_lighting", enableLighting: false };
      handler()(cmd);

      expect(mockViewer.scene.atmosphere.dynamicLighting).toBe("NONE");
    });

    it("should work when atmosphere is undefined on scene", () => {
      // Remove atmosphere from scene
      (mockViewer.scene as unknown as { atmosphere: undefined }).atmosphere =
        undefined;

      const cmd: MCPCommand = {
        type: "globe_lighting",
        enableLighting: true,
        enableDynamicAtmosphere: true,
        enableSunLighting: true,
      };
      const result = handler()(cmd) as { success: boolean };

      // Should succeed even without atmosphere object
      expect(result.success).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Handler registration
  // ───────────────────────────────────────────────────────────────────────────

  describe("Command handler registration", () => {
    it("should register all required animation command handlers", () => {
      const requiredHandlers = [
        "clock_control",
        "animation_create",
        "animation_control",
        "animation_remove",
        "animation_update_path",
        "animation_camera_tracking",
        "animation_list_active",
        "globe_lighting",
      ];

      for (const name of requiredHandlers) {
        expect(commandHandlers.has(name)).toBe(true);
        expect(typeof commandHandlers.get(name)).toBe("function");
      }
    });

    it("should have the correct number of handlers", () => {
      expect(commandHandlers.size).toBe(8);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Error handling
  // ───────────────────────────────────────────────────────────────────────────

  describe("Error handling", () => {
    it("animation_create should return structured error when addAnimatedModelEntity throws", () => {
      vi.mocked(entityUtils.addAnimatedModelEntity).mockImplementationOnce(
        () => {
          throw new Error("Cesium model error");
        },
      );

      const cmd: MCPCommand = {
        type: "animation_create",
        animationId: "bad-model",
        positionSamples: makeSamples(2),
        startTime: "2024-01-01T00:00:00Z",
        stopTime: "2024-01-01T01:00:00Z",
        modelUri: "bad.glb",
        speedMultiplier: 10,
        autoPlay: false,
        trackCamera: false,
      };

      const result = commandHandlers.get("animation_create")!(cmd) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cesium model error");
    });

    it("globe_lighting should return error when scene throws", () => {
      Object.defineProperty(mockViewer.scene.globe, "enableLighting", {
        set() {
          throw new Error("Scene error");
        },
        configurable: true,
      });

      const cmd: MCPCommand = { type: "globe_lighting", enableLighting: true };
      const result = commandHandlers.get("globe_lighting")!(cmd) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Scene error");
    });
  });
});
