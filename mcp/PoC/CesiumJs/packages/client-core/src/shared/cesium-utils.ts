/**
 * Shared Cesium Utility Functions
 * Common operations used across multiple MCP managers
 */

import type { Position, ColorRGBA, JulianDate } from '../types/mcp.js';

/**
 * Decimate array to max size while preserving start/end points
 * Prevents memory issues from too many position samples
 */
export function decimateArray<T>(arr: T[], maxSize: number = 500): T[] {
  if (arr.length <= maxSize) return arr;
  
  const result: T[] = [arr[0]]; // Always include first
  const step = (arr.length - 1) / (maxSize - 1);
  
  for (let i = 1; i < maxSize - 1; i++) {
    const index = Math.round(i * step);
    result.push(arr[index]);
  }
  
  result.push(arr[arr.length - 1]); // Always include last
  return result;
}

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
export function createCartesian3(longitude: number, latitude: number, height: number = 0): any {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
}

/**
 * Create a Cartesian3 position from a Position object
 */
export function positionToCartesian3(position: Position): any {
  return Cesium.Cartesian3.fromDegrees(
    position.longitude,
    position.latitude,
    position.height || 0
  );
}

/**
 * Convert an array of Position objects to Cartesian3 array
 */
export function positionsToCartesian3Array(positions: Position[]): any[] {
  return positions.map(pos => positionToCartesian3(pos));
}

/**
 * Convert a Cartesian3 position to cartographic (lon, lat, height)
 */
export function cartesian3ToPosition(cartesian: any): Position {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: toDegrees(cartographic.longitude),
    latitude: toDegrees(cartographic.latitude),
    height: cartographic.height
  };
}

/**
 * Parse a color from various formats and convert to Cesium.Color
 * Supports: CSS color strings, hex codes, and RGBA objects
 */
export function parseColor(color: string | ColorRGBA | undefined | null, defaultColor?: any): any {
  if (!color) return defaultColor || null;

  // If it's a string (CSS color or hex)
  if (typeof color === 'string') {
    try {
      return Cesium.Color.fromCssColorString(color);
    } catch (e) {
      console.warn(`Failed to parse color: ${color}`, e);
      return defaultColor || Cesium.Color.WHITE;
    }
  }

  // If it's an RGBA object
  if (typeof color === 'object' && 'red' in color) {
    return new Cesium.Color(
      color.red || 0,
      color.green || 0,
      color.blue || 0,
      color.alpha !== undefined ? color.alpha : 1.0
    );
  }

  return defaultColor || null;
}

/**
 * Parse Julian date from string, object, or undefined
 */
export function parseJulianDate(julianDate: string | JulianDate | undefined): any {
  if (!julianDate) {
    return Cesium.JulianDate.now();
  }

  // If it's already a JulianDate object with dayNumber and secondsOfDay
  if (typeof julianDate === 'object' && 'dayNumber' in julianDate && 'secondsOfDay' in julianDate) {
    return new Cesium.JulianDate(julianDate.dayNumber, julianDate.secondsOfDay);
  }

  // If it's an ISO 8601 string
  if (typeof julianDate === 'string') {
    try {
      return Cesium.JulianDate.fromIso8601(julianDate);
    } catch (e) {
      console.warn(`Failed to parse Julian date: ${julianDate}`, e);
      return Cesium.JulianDate.now();
    }
  }

  return Cesium.JulianDate.now();
}

/**
 * Format Julian date to ISO 8601 string
 */
export function formatJulianDate(julianDate: any): string {
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
  position: any, 
  heading: number, 
  pitch: number, 
  roll: number,
  ellipsoid?: any,
  fixedFrameTransform?: any
): any {
  return Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(
      toRadians(heading),
      toRadians(pitch),
      toRadians(roll)
    ),
    ellipsoid || Cesium.Ellipsoid.WGS84,
    fixedFrameTransform || Cesium.Transforms.eastNorthUpToFixedFrame
  );
}

/**
 * Create a HeadingPitchRange for camera positioning
 */
export function createHeadingPitchRange(heading: number, pitch: number, range: number): any {
  return new Cesium.HeadingPitchRange(
    toRadians(heading),
    toRadians(pitch),
    range
  );
}

/**
 * Get current time as Julian date
 */
export function getCurrentJulianDate(): any {
  return Cesium.JulianDate.now();
}

/**
 * Create a Rectangle from an array of Cartesian3 positions
 */
export function createRectangleFromPositions(positions: any[]): any {
  return Cesium.Rectangle.fromCartesianArray(positions);
}

/**
 * Create an east-north-up transform at a position
 */
export function createEastNorthUpTransform(position: any): any {
  return Cesium.Transforms.eastNorthUpToFixedFrame(position);
}

/**
 * Get entity type from entity object
 */
export function getEntityType(entity: any): string {
  if (entity.point) return 'point';
  if (entity.label) return 'label';
  if (entity.polygon) return 'polygon';
  if (entity.polyline) return 'polyline';
  if (entity.billboard) return 'billboard';
  if (entity.model) return 'model';
  if (entity.ellipse) return 'ellipse';
  if (entity.rectangle) return 'rectangle';
  if (entity.wall) return 'wall';
  if (entity.cylinder) return 'cylinder';
  if (entity.box) return 'box';
  if (entity.corridor) return 'corridor';
  return 'unknown';
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert a ClockRange string to Cesium.ClockRange enum
 */
export function parseClockRange(range: string): any {
  switch (range) {
    case 'UNBOUNDED':
      return Cesium.ClockRange.UNBOUNDED;
    case 'CLAMPED':
      return Cesium.ClockRange.CLAMPED;
    case 'LOOP_STOP':
      return Cesium.ClockRange.LOOP_STOP;
    default:
      return Cesium.ClockRange.LOOP_STOP;
  }
}

/**
 * Convert a ClockStep string to Cesium.ClockStep enum
 */
export function parseClockStep(step: string): any {
  switch (step) {
    case 'TICK_DEPENDENT':
      return Cesium.ClockStep.TICK_DEPENDENT;
    case 'SYSTEM_CLOCK_MULTIPLIER':
      return Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    case 'SYSTEM_CLOCK':
      return Cesium.ClockStep.SYSTEM_CLOCK;
    default:
      return Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  }
}

/**
 * Parse easing function string to Cesium.EasingFunction
 */
export function parseEasingFunction(easingFunctionName: string | undefined): any {
  if (!easingFunctionName) return undefined;
  return (Cesium.EasingFunction as any)[easingFunctionName];
}

/**
 * Set the clock multiplier (animation speed)
 */
export function setClockMultiplier(viewer: any, multiplier: number): void {
  viewer.clock.multiplier = multiplier;
}

/**
 * Set whether the clock should animate
 */
export function setClockShouldAnimate(viewer: any, shouldAnimate: boolean): void {
  viewer.clock.shouldAnimate = shouldAnimate;
  viewer.shouldAnimate = shouldAnimate;
}

/**
 * Set the current time on the clock
 */
export function setClockCurrentTime(viewer: any, time: string | JulianDate): void {
  viewer.clock.currentTime = parseJulianDate(time);
}

/**
 * Configure clock with start/stop times and range
 */
export function configureClockTimes(
  viewer: any, 
  startTime: string | JulianDate, 
  stopTime: string | JulianDate,
  currentTime?: string | JulianDate,
  clockRange?: string
): { start: any; stop: any; current: any } {
  const start = parseJulianDate(startTime);
  const stop = parseJulianDate(stopTime);
  const current = currentTime ? parseJulianDate(currentTime) : start.clone();
  
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = current.clone();
  
  if (clockRange) {
    viewer.clock.clockRange = parseClockRange(clockRange);
  }
  
  return { start, stop, current };
}

/**
 * Update timeline to match clock settings
 */
export function updateTimeline(viewer: any, startTime?: any, stopTime?: any): void {
  if (viewer.timeline) {
    viewer.timeline.updateFromClock();
    if (startTime && stopTime) {
      viewer.timeline.zoomTo(startTime, stopTime);
    }
  }
}
