/**
 * Global Cesium mock for integration / e2e tests.
 *
 * CesiumJS is normally loaded as a browser global. In the Node test
 * environment it is not available, so we provide lightweight stubs for every
 * API surface used by src/shared/cesium-utils.ts and
 * src/shared/camera-utils.ts.
 */

type Vec3 = {
  x: number;
  y: number;
  z: number;
  longitude?: number;
  latitude?: number;
  height?: number;
};

const CesiumMock = {
  Math: {
    toRadians: (degrees: number) => (degrees * Math.PI) / 180,
    toDegrees: (radians: number) => (radians * 180) / Math.PI,
    RADIANS_PER_DEGREE: Math.PI / 180,
  },

  // Cartesian3 as a constructable class with static helpers.
  // The mock stores degree values in .longitude/.latitude so that
  // fromDegrees round-trips cleanly through Cartographic.fromCartesian.
  Cartesian3: Object.assign(
    class {
      x: number;
      y: number;
      z: number;
      longitude: number;
      latitude: number;
      height: number;
      constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.longitude = x;
        this.latitude = y;
        this.height = z;
      }
    },
    {
      fromDegrees: (longitude: number, latitude: number, height = 0): Vec3 => ({
        x: longitude,
        y: latitude,
        z: height,
        longitude,
        latitude,
        height,
      }),
      ZERO: { x: 0, y: 0, z: 0 },
    },
  ),

  // Cartographic.fromCartesian must return RADIANS (matching real Cesium) so
  // that cartesian3ToPosition's subsequent toDegrees() call round-trips correctly.
  // The mock Cartesian3 stores degree values, so we convert them here.
  Cartographic: {
    fromCartesian: (cartesian: Vec3) => ({
      longitude: ((cartesian.longitude ?? cartesian.x) * Math.PI) / 180,
      latitude: ((cartesian.latitude ?? cartesian.y) * Math.PI) / 180,
      height: cartesian.height ?? cartesian.z,
    }),
  },

  Rectangle: {
    fromDegrees: (
      west: number,
      south: number,
      east: number,
      north: number,
    ) => ({
      west,
      south,
      east,
      north,
    }),
    fromCartesianArray: (_positions: unknown) => ({
      west: 0,
      south: 0,
      east: 0,
      north: 0,
    }),
  },

  ClockRange: {
    UNBOUNDED: 0,
    CLAMPED: 1,
    LOOP_STOP: 2,
  },

  ClockStep: {
    TICK_DEPENDENT: 0,
    SYSTEM_CLOCK_MULTIPLIER: 1,
    SYSTEM_CLOCK: 2,
  },

  HeadingPitchRoll: class {
    heading: number;
    pitch: number;
    roll: number;
    constructor(heading = 0, pitch = 0, roll = 0) {
      this.heading = heading;
      this.pitch = pitch;
      this.roll = roll;
    }
  },

  HeadingPitchRange: class {
    heading: number;
    pitch: number;
    range: number;
    constructor(heading = 0, pitch = 0, range = 0) {
      this.heading = heading;
      this.pitch = pitch;
      this.range = range;
    }
  },

  Color: Object.assign(
    class {
      r: number;
      g: number;
      b: number;
      a: number;
      constructor(r = 1, g = 1, b = 1, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      }
      withAlpha(alpha: number) {
        return { r: this.r, g: this.g, b: this.b, a: alpha };
      }
    },
    {
      WHITE: {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
        withAlpha(a: number) {
          return { r: 1, g: 1, b: 1, a };
        },
      },
      BLACK: {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
        withAlpha(a: number) {
          return { r: 0, g: 0, b: 0, a };
        },
      },
      YELLOW: {
        r: 1,
        g: 1,
        b: 0,
        a: 1,
        withAlpha(a: number) {
          return { r: 1, g: 1, b: 0, a };
        },
      },
      LIME: {
        r: 0,
        g: 1,
        b: 0,
        a: 1,
        withAlpha(a: number) {
          return { r: 0, g: 1, b: 0, a };
        },
      },
      BLUE: {
        r: 0,
        g: 0,
        b: 1,
        a: 1,
        withAlpha(a: number) {
          return { r: 0, g: 0, b: 1, a };
        },
      },
      RED: {
        r: 1,
        g: 0,
        b: 0,
        a: 1,
        withAlpha(a: number) {
          return { r: 1, g: 0, b: 0, a };
        },
      },
      fromCssColorString: (_css: string) => ({ r: 1, g: 1, b: 1, a: 1 }),
    },
  ),

  JulianDate: (() => {
    interface JD {
      dayNumber: number;
      secondsOfDay: number;
      clone: () => JD;
    }
    function makeJD(dayNumber = 0, secondsOfDay = 0): JD {
      return {
        dayNumber,
        secondsOfDay,
        clone: () => makeJD(dayNumber, secondsOfDay),
      };
    }
    function JulianDateCtor(
      this: Record<string, unknown>,
      dayNumber = 0,
      secondsOfDay = 0,
    ) {
      this.dayNumber = dayNumber;
      this.secondsOfDay = secondsOfDay;
      this.clone = () => makeJD(dayNumber, secondsOfDay);
    }
    JulianDateCtor.now = () => makeJD(0, 0);
    JulianDateCtor.fromIso8601 = (_iso: string) => makeJD(0, 0);
    JulianDateCtor.toIso8601 = (_jd: unknown) => new Date().toISOString();
    return JulianDateCtor;
  })(),

  Transforms: {
    eastNorthUpToFixedFrame: (_position: unknown) => new Array(16).fill(0),
    headingPitchRollQuaternion: (
      _position: unknown,
      _hpr: unknown,
      _ellipsoid?: unknown,
      _fixedFrameTransform?: unknown,
    ) => ({ x: 0, y: 0, z: 0, w: 1 }),
  },

  Ellipsoid: {
    WGS84: {},
  },

  Matrix4: {
    IDENTITY: new Array(16).fill(0).map((_, i) => (i % 5 === 0 ? 1 : 0)),
  },

  // ── Animation-related stubs ─────────────────────────────────────────────

  SampledPositionProperty: class {
    addSample(_time: unknown, _position: unknown) {}
    setInterpolationOptions(_options: unknown) {}
    getValue(_time: unknown) {
      return { x: 0, y: 0, z: 0 };
    }
  },

  LagrangePolynomialApproximation: { type: "Lagrange" },

  ConstantProperty: class {
    private _value: unknown;
    constructor(value: unknown) {
      this._value = value;
    }
    getValue() {
      return this._value;
    }
  },

  PolylineGlowMaterialProperty: class {
    glowPower: number;
    color: unknown;
    constructor(options: { glowPower?: number; color?: unknown } = {}) {
      this.glowPower = options.glowPower ?? 0.1;
      this.color = options.color ?? null;
    }
  },

  ModelGraphics: class {
    uri: string;
    minimumPixelSize: number;
    scale: number;
    constructor(
      options: { uri?: string; minimumPixelSize?: number; scale?: number } = {},
    ) {
      this.uri = options.uri ?? "";
      this.minimumPixelSize = options.minimumPixelSize ?? 128;
      this.scale = options.scale ?? 1.0;
    }
  },

  VelocityOrientationProperty: class {
    constructor(_positionProperty: unknown) {}
    getValue() {
      return { x: 0, y: 0, z: 0, w: 1 };
    }
  },

  PathGraphics: class {
    show: boolean;
    leadTime: unknown;
    trailTime: unknown;
    width: unknown;
    resolution: unknown;
    material: unknown;
    constructor(options: Record<string, unknown> = {}) {
      this.show = (options.show as boolean) ?? true;
      this.leadTime = options.leadTime ?? 0;
      this.trailTime = options.trailTime ?? 60;
      this.width = options.width ?? 10;
      this.resolution = options.resolution ?? 1;
      this.material = options.material ?? null;
    }
  },

  DynamicAtmosphereLightingType: {
    NONE: "NONE",
    SUNLIGHT: "SUNLIGHT",
    SCENE_LIGHT: "SCENE_LIGHT",
  },

  // ── Entity-related stubs ────────────────────────────────────────────────

  HeightReference: {
    NONE: 0,
    CLAMP_TO_GROUND: 1,
    RELATIVE_TO_GROUND: 2,
  },

  LabelStyle: {
    FILL: 0,
    OUTLINE: 1,
    FILL_AND_OUTLINE: 2,
  },

  Cartesian2: class {
    x: number;
    y: number;
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  },

  ColorBlendMode: {
    HIGHLIGHT: 0,
    REPLACE: 1,
    MIX: 2,
  },

  ClassificationType: {
    TERRAIN: 0,
    CESIUM_3D_TILE: 1,
    BOTH: 2,
  },

  CornerType: {
    ROUNDED: 0,
    MITERED: 1,
    BEVELED: 2,
  },

  ShadowMode: {
    DISABLED: 0,
    ENABLED: 1,
    CAST_ONLY: 2,
    RECEIVE_ONLY: 3,
  },

  Quaternion: {
    fromHeadingPitchRoll: (_hpr: unknown) => ({ x: 0, y: 0, z: 0, w: 1 }),
    IDENTITY: { x: 0, y: 0, z: 0, w: 1 },
  },
};

// Expose as global so that cesium-utils.ts / camera-utils.ts can access it.
(globalThis as Record<string, unknown>).Cesium = CesiumMock;
