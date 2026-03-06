/**
 * Creates a mock Cesium viewer with real-like structure for integration testing.
 *
 * The mock tracks camera position, orientation, and supports common operations
 * like setView, flyTo, lookAt, lookAtTransform, and rotateRight.
 *
 * Internal storage convention (matching real Cesium):
 *   - positionCartographic longitude/latitude: RADIANS
 *   - camera.heading / pitch / roll:           RADIANS
 *
 * Use `_getTestState()` on the returned viewer to inspect current
 * position/orientation in assertions – it always returns DEGREES.
 *
 * Suitable for camera, entity, and animation MCP server tests.
 */

import type { CesiumViewer } from "../../src/types/cesium-types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function toRad(deg: number): number {
  return deg * DEG_TO_RAD;
}
function toDeg(rad: number): number {
  return rad * RAD_TO_DEG;
}
// Round to 10 decimal places to eliminate deg→rad→deg floating-point noise.
function roundDeg(rad: number): number {
  return Math.round(toDeg(rad) * 1e10) / 1e10;
}

export function createTestViewer(): CesiumViewer {
  // Internal state stored in RADIANS (matches real Cesium camera API)
  const currentPosition: {
    longitude: number;
    latitude: number;
    height: number;
    lookAtTarget?: unknown;
    lookAtOffset?: unknown;
    lookAtTransformCalled?: boolean;
  } = {
    longitude: toRad(-85.944), // ≈ -1.5 rad
    latitude: toRad(40.107), // ≈  0.7 rad
    height: 15000000,
  };

  const currentOrientation = {
    heading: 0, //  0 rad =   0°
    pitch: toRad(-90), // -π/2 rad = -90°
    roll: 0, //  0 rad =   0°
  };

  const tickListeners: Array<() => void> = [];

  type MockCameraOptions = {
    destination?: { longitude?: number; latitude?: number; height?: number };
    orientation?: { heading?: number; pitch?: number; roll?: number };
    complete?: () => void;
  };

  // Build camera object; heading/pitch/roll are added as live getters below.
  const cameraObj = {
    positionCartographic: currentPosition, // mutable – stays in sync
    position: { x: 0, y: 0, z: 0 },
    direction: { x: 0, y: 1, z: 0 },
    up: { x: 0, y: 0, z: 1 },
    right: { x: 1, y: 0, z: 0 },

    // camera-utils passes destination as a Cartesian3 mock (lon/lat in DEGREES)
    // and orientation as a plain { heading, pitch, roll } already in RADIANS.
    setView: (options: MockCameraOptions) => {
      if (options.destination) {
        const lon = options.destination.longitude;
        const lat = options.destination.latitude;
        if (lon !== undefined) {
          currentPosition.longitude = toRad(lon);
        }
        if (lat !== undefined) {
          currentPosition.latitude = toRad(lat);
        }
        if (options.destination.height !== undefined) {
          currentPosition.height = options.destination.height;
        }
      }
      if (options.orientation) {
        if (options.orientation.heading !== undefined) {
          currentOrientation.heading = options.orientation.heading;
        }
        if (options.orientation.pitch !== undefined) {
          currentOrientation.pitch = options.orientation.pitch;
        }
        if (options.orientation.roll !== undefined) {
          currentOrientation.roll = options.orientation.roll;
        }
      }
    },

    // camera-utils passes destination as Cartesian3 mock (lon/lat in DEGREES)
    // and orientation as a HeadingPitchRoll instance (already in RADIANS).
    flyTo: (options: MockCameraOptions): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (options.destination) {
            const lon = options.destination.longitude;
            const lat = options.destination.latitude;
            if (lon !== undefined) {
              currentPosition.longitude = toRad(lon);
            }
            if (lat !== undefined) {
              currentPosition.latitude = toRad(lat);
            }
            if (options.destination.height !== undefined) {
              currentPosition.height = options.destination.height;
            }
          }
          if (
            options.orientation &&
            typeof options.orientation.heading === "number"
          ) {
            currentOrientation.heading = options.orientation.heading;
            currentOrientation.pitch =
              options.orientation.pitch ?? currentOrientation.pitch;
            currentOrientation.roll =
              options.orientation.roll ?? currentOrientation.roll;
          }
          if (options.complete) {
            options.complete();
          }
          resolve();
        }, 10);
      });
    },

    lookAt: (target: unknown, offset: unknown) => {
      currentPosition.lookAtTarget = target;
      currentPosition.lookAtOffset = offset;
    },

    // Stub for lookAtTransform – called by lookAtPosition() in camera-utils.ts
    lookAtTransform: (_transform: unknown, _offset: unknown) => {
      currentPosition.lookAtTransformCalled = true;
    },

    rotateRight: (angle: number) => {
      currentOrientation.heading += angle;
    },

    // Returns a rectangle in RADIANS so getCameraViewRectangle can apply toDegrees.
    computeViewRectangle: () => ({
      west: currentPosition.longitude - toRad(1),
      south: currentPosition.latitude - toRad(1),
      east: currentPosition.longitude + toRad(1),
      north: currentPosition.latitude + toRad(1),
    }),
  };

  // Live getters so getCameraPosition() always reads current radians values.
  Object.defineProperty(cameraObj, "heading", {
    get: () => currentOrientation.heading,
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(cameraObj, "pitch", {
    get: () => currentOrientation.pitch,
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(cameraObj, "roll", {
    get: () => currentOrientation.roll,
    enumerable: true,
    configurable: true,
  });

  return {
    camera: cameraObj,

    // ── Entity collection ──────────────────────────────────────────────────
    entities: (() => {
      const store = new Map<string, Record<string, unknown>>();
      let idCounter = 0;
      const entityCollection = {
        add(entityConfig: Record<string, unknown>) {
          const id =
            (entityConfig.id as string | undefined) ?? `auto-${++idCounter}`;
          // Wrap a plain position object with a getValue() shim so that
          // entity-manager.ts's listEntities() can call position.getValue().
          let position = entityConfig.position as
            | Record<string, unknown>
            | undefined;
          if (
            position &&
            typeof (position as Record<string, unknown>).getValue !== "function"
          ) {
            const rawPos = position;
            position = { getValue: (_time: unknown) => rawPos };
          }
          const entity = { ...entityConfig, id, position };
          store.set(id, entity);
          return entity;
        },
        remove(entity: { id: string }) {
          return store.delete(entity.id);
        },
        getById(id: string) {
          return store.get(id);
        },
        get values() {
          return Array.from(store.values());
        },
      };
      return entityCollection;
    })(),

    scene: {
      camera: null as unknown,
      screenSpaceCameraController: {
        enableCollisionDetection: true,
        minimumZoomDistance: 1.0,
        maximumZoomDistance: 40000000.0,
        enableTilt: true,
        enableRotate: true,
        enableTranslate: true,
        enableZoom: true,
        enableLook: true,
      },
      globe: {
        enableLighting: false,
        showGroundAtmosphere: false,
        dynamicAtmosphereLighting: false,
        dynamicAtmosphereLightingFromSun: false,
        ellipsoid: {
          cartographicToCartesian: (cartographic: {
            latitude: number;
            longitude: number;
          }) => ({
            x:
              Math.cos(cartographic.latitude) *
              Math.cos(cartographic.longitude),
            y:
              Math.cos(cartographic.latitude) *
              Math.sin(cartographic.longitude),
            z: Math.sin(cartographic.latitude),
          }),
        },
      },
      atmosphere: {
        dynamicLighting: "NONE",
      },
    } as unknown,

    // ── Clock ─────────────────────────────────────────────────────────────
    clock: (() => {
      const clockState = {
        shouldAnimate: false,
        multiplier: 1.0,
        currentTime: { dayNumber: 0, secondsOfDay: 0 },
        startTime: { dayNumber: 0, secondsOfDay: 0 },
        stopTime: { dayNumber: 1, secondsOfDay: 0 },
        clockRange: 1,
        clockStep: 0,
        onTick: {
          addEventListener: (callback: () => void) => {
            tickListeners.push(callback);
            return () => {
              const index = tickListeners.indexOf(callback);
              if (index > -1) {
                tickListeners.splice(index, 1);
              }
            };
          },
        },
        _simulateTick: () => {
          tickListeners.forEach((listener) => listener());
        },
      };
      return clockState;
    })(),

    // ── Timeline ──────────────────────────────────────────────────────────
    timeline: {
      zoomTo: (_start: unknown, _stop: unknown) => {},
    },

    // ── Tracked entity ────────────────────────────────────────────────────
    trackedEntity: undefined as unknown,

    // Returns DEGREES for both position and orientation – use in test assertions.
    // Uses roundDeg (10 decimal places) to eliminate deg→rad→deg floating-point noise.
    _getTestState: () => ({
      position: {
        longitude: roundDeg(currentPosition.longitude),
        latitude: roundDeg(currentPosition.latitude),
        height: currentPosition.height,
      },
      orientation: {
        heading: roundDeg(currentOrientation.heading),
        pitch: roundDeg(currentOrientation.pitch),
        roll: roundDeg(currentOrientation.roll),
      },
    }),
  } as unknown as CesiumViewer;
}
