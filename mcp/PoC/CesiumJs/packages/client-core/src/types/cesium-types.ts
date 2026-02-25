// Import actual Cesium types
import type {
  Cartesian3,
  Cartographic,
  HeadingPitchRange,
  HeadingPitchRoll,
  Matrix4,
  Rectangle,
  RectangleGraphics,
  Color,
  Quaternion,
  JulianDate,
  Ellipsoid,
  EasingFunction,
  ClockRange,
  ClockStep,
  Transforms,
  Camera,
  Scene,
  Clock,
  Viewer,
  Entity,
} from "cesium";

// Re-export Cesium types with consistent naming
export type CesiumCartesian3 = Cartesian3;
export type CesiumCartographic = Cartographic;
export type CesiumHeadingPitchRange = HeadingPitchRange;
export type CesiumHeadingPitchRoll = HeadingPitchRoll;
export type CesiumMatrix4 = Matrix4;
export type CesiumRectangle = Rectangle;
export type CesiumRectangleGraphics = RectangleGraphics;
export type CesiumRectangleGraphicsOptions =
  RectangleGraphics.ConstructorOptions;
export type CesiumColor = Color;
export type CesiumQuaternion = Quaternion;
export type CesiumJulianDate = JulianDate;
export type CesiumEasingFunction = EasingFunction.Callback;
export type CesiumClockRange = ClockRange;
export type CesiumClockStep = ClockStep;
export type CesiumEllipsoid = Ellipsoid;
export type CesiumCameraOrientation = HeadingPitchRoll;

export type CesiumFixedFrameTransform =
  typeof Transforms.eastNorthUpToFixedFrame;

// Camera options using native Cesium types
export type CesiumCameraFlyToOptions = {
  destination: Cartesian3 | Rectangle;
  orientation?:
    | HeadingPitchRoll
    | {
        direction?: Cartesian3;
        up?: Cartesian3;
      };
  duration?: number;
  easingFunction?: EasingFunction.Callback;
  maximumHeight?: number;
  pitchAdjustHeight?: number;
  flyOverLongitude?: number;
  flyOverLongitudeWeight?: number;
  complete?: () => void;
  cancel?: () => void;
};

export type CesiumCameraViewOptions = {
  destination: Cartesian3 | Rectangle;
  orientation?:
    | HeadingPitchRoll
    | {
        direction?: Cartesian3;
        up?: Cartesian3;
      };
};

export type CesiumLabelStyle = number;

export type CesiumEntityCollection = { values?: CesiumEntity[] };

export type CesiumDataSource = { entities?: CesiumEntityCollection };

export type CesiumZoomTarget =
  | CesiumEntity
  | CesiumEntity[]
  | CesiumEntityCollection
  | CesiumDataSource;

// Use native Cesium types directly
export type CesiumCamera = Camera;
export type CesiumScene = Scene;
export type CesiumClock = Clock;

export type CesiumTimeline = {
  updateFromClock: () => void;
  zoomTo: (start: JulianDate, stop: JulianDate) => void;
};

// CesiumViewer extends the native Cesium Viewer
export type CesiumViewer = Viewer;
export type CesiumEntity = Entity;
