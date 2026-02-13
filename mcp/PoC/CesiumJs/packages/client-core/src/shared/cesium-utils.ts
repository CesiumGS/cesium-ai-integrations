/**
 * Shared Cesium Utility Functions
 * Common operations used across multiple MCP managers
 */
import type { Position, ColorRGBA, JulianDate } from "../types/mcp.js";
import type {
  CesiumCartesian3,
  CesiumHeadingPitchRange,
  CesiumColor,
  CesiumQuaternion,
  CesiumEllipsoid,
  CesiumFixedFrameTransform,
  CesiumEasingFunction,
  CesiumJulianDate,
} from "../types/cesium-types.js";

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return Cesium.Math.toRadians(degrees);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return Cesium.Math.toDegrees(radians);
}

/**
 * Create a Cartesian3 position from longitude, latitude, and height
 */
export function createCartesian3(
  longitude: number,
  latitude: number,
  height: number = 0,
): CesiumCartesian3 {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
}

/**
 * Create a Cartesian3 position from a Position object
 */
export function positionToCartesian3(position: Position): CesiumCartesian3 {
  return Cesium.Cartesian3.fromDegrees(
    position.longitude,
    position.latitude,
    position.height || 0,
  );
}

/**
 * Convert an array of Position objects to Cartesian3 array
 */
export function positionsToCartesian3Array(
  positions: Position[],
): CesiumCartesian3[] {
  return positions.map((pos) => positionToCartesian3(pos));
}

/**
 * Convert a Cartesian3 position to cartographic (lon, lat, height)
 */
export function cartesian3ToPosition(cartesian: CesiumCartesian3): Position {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: toDegrees(cartographic.longitude),
    latitude: toDegrees(cartographic.latitude),
    height: cartographic.height,
  };
}

/**
 * Parse a color from various formats and convert to Cesium.Color
 * Supports: CSS color strings, hex codes, and RGBA objects
 */
export function parseColor(
  color: string | ColorRGBA | undefined | null,
  defaultColor?: CesiumColor | null,
): CesiumColor | null {
  if (!color) {
    return defaultColor || null;
  }

  // If it's a string (CSS color or hex)
  if (typeof color === "string") {
    try {
      return Cesium.Color.fromCssColorString(color);
    } catch (e) {
      console.warn(`Failed to parse color: ${color}`, e);
      return defaultColor || Cesium.Color.WHITE;
    }
  }

  // If it's an RGBA object
  if (typeof color === "object" && "red" in color) {
    return new Cesium.Color(
      color.red || 0,
      color.green || 0,
      color.blue || 0,
      color.alpha !== undefined ? color.alpha : 1.0,
    );
  }

  return defaultColor || null;
}

/**
 * Parse Julian date from string, object, or undefined
 */
export function parseJulianDate(
  julianDate: string | JulianDate | undefined,
): CesiumJulianDate {
  if (!julianDate) {
    return Cesium.JulianDate.now() as CesiumJulianDate;
  }

  // If it's already a JulianDate object with dayNumber and secondsOfDay
  if (
    typeof julianDate === "object" &&
    "dayNumber" in julianDate &&
    "secondsOfDay" in julianDate
  ) {
    return new Cesium.JulianDate(
      julianDate.dayNumber,
      julianDate.secondsOfDay,
    ) as CesiumJulianDate;
  }

  // If it's an ISO 8601 string
  if (typeof julianDate === "string") {
    try {
      return Cesium.JulianDate.fromIso8601(julianDate) as CesiumJulianDate;
    } catch (e) {
      console.warn(`Failed to parse Julian date: ${julianDate}`, e);
      return Cesium.JulianDate.now() as CesiumJulianDate;
    }
  }

  return Cesium.JulianDate.now() as CesiumJulianDate;
}

/**
 * Format Julian date to ISO 8601 string
 */
export function formatJulianDate(julianDate: CesiumJulianDate): string {
  return Cesium.JulianDate.toIso8601(julianDate);
}

/**
 * Create a HeadingPitchRoll orientation quaternion
 * @param position - Cartesian3 position
 * @param heading - Heading in degrees
 * @param pitch - Pitch in degrees
 * @param roll - Roll in degrees
 * @param ellipsoid - Optional ellipsoid (defaults to WGS84)
 * @param fixedFrameTransform - Optional transform (defaults to eastNorthUpToFixedFrame)
 */
export function createOrientation(
  position: CesiumCartesian3,
  heading: number,
  pitch: number,
  roll: number,
  ellipsoid?: CesiumEllipsoid,
  fixedFrameTransform?: CesiumFixedFrameTransform,
): CesiumQuaternion {
  return Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(
      toRadians(heading),
      toRadians(pitch),
      toRadians(roll),
    ),
    ellipsoid || Cesium.Ellipsoid.WGS84,
    fixedFrameTransform || Cesium.Transforms.eastNorthUpToFixedFrame,
  );
}

/**
 * Create a HeadingPitchRange for camera positioning
 */
export function createHeadingPitchRange(
  heading: number,
  pitch: number,
  range: number,
): CesiumHeadingPitchRange {
  return new Cesium.HeadingPitchRange(
    toRadians(heading),
    toRadians(pitch),
    range,
  );
}

/**
 * Parse easing function string to Cesium.EasingFunction
 */
export function parseEasingFunction(
  easingFunctionName: string | undefined,
): CesiumEasingFunction | undefined {
  if (!easingFunctionName) {
    return undefined;
  }
  const easingFunctions = Cesium.EasingFunction as Record<
    string,
    CesiumEasingFunction
  >;
  return easingFunctions[easingFunctionName];
}
