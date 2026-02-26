/**
 * Shared Camera Utilities
 * Helper functions for camera control and positioning
 */

import type { Position, CameraOrientation } from "../types/mcp.js";
import type {
  CesiumViewer,
  CesiumCameraFlyToOptions,
} from "../types/cesium-types.js";
import {
  createCartesian3,
  toRadians,
  createHeadingPitchRange,
  parseEasingFunction,
} from "./cesium-utils.js";
import { DEFAULT_CAMERA_PITCH } from "./constants.js";

/**
 * Fly camera to position with animation
 * Uses Cesium's idiomatic callback pattern for complete and cancel events
 */
export function flyToPosition(
  viewer: CesiumViewer,
  position: Position,
  orientation: CameraOrientation = {},
  duration: number = 3,
  options: {
    easingFunction?: string;
    maximumHeight?: number;
    pitchAdjustHeight?: number;
    flyOverLongitude?: number;
    flyOverLongitudeWeight?: number;
    complete?: () => void;
    cancel?: () => void;
  } = {},
): void {
  const flyToOptions: CesiumCameraFlyToOptions = {
    destination: createCartesian3(
      position.longitude,
      position.latitude,
      position.height || 0,
    ),
    orientation: new Cesium.HeadingPitchRoll(
      toRadians(orientation.heading || 0),
      toRadians(orientation.pitch || DEFAULT_CAMERA_PITCH),
      toRadians(orientation.roll || 0),
    ),
    duration: duration,
  };

  // Add callbacks
  if (options.complete) {
    flyToOptions.complete = options.complete;
  }
  if (options.cancel) {
    flyToOptions.cancel = options.cancel;
  }

  // Add advanced options
  if (options.easingFunction) {
    flyToOptions.easingFunction = parseEasingFunction(options.easingFunction);
  }
  if (options.maximumHeight !== undefined) {
    flyToOptions.maximumHeight = options.maximumHeight;
  }
  if (options.pitchAdjustHeight !== undefined) {
    flyToOptions.pitchAdjustHeight = options.pitchAdjustHeight;
  }
  if (options.flyOverLongitude !== undefined) {
    flyToOptions.flyOverLongitude = toRadians(options.flyOverLongitude);
  }
  if (options.flyOverLongitudeWeight !== undefined) {
    flyToOptions.flyOverLongitudeWeight = options.flyOverLongitudeWeight;
  }

  viewer.camera.flyTo(flyToOptions);
}

/**
 * Set camera view instantly (no animation)
 */
export function setCameraView(
  viewer: CesiumViewer,
  position: Position,
  orientation: CameraOrientation = {},
): void {
  viewer.camera.setView({
    destination: createCartesian3(
      position.longitude,
      position.latitude,
      position.height || 0,
    ),
    orientation: {
      heading: toRadians(orientation.heading || 0),
      pitch: toRadians(orientation.pitch || DEFAULT_CAMERA_PITCH),
      roll: toRadians(orientation.roll || 0),
    },
  });
}

/**
 * Get current camera position and orientation
 */
export function getCameraPosition(viewer: CesiumViewer): {
  position: Position;
  orientation: CameraOrientation;
} {
  const camera = viewer.camera;
  const cartographic = camera.positionCartographic;

  return {
    position: {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
    },
    orientation: {
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll),
    },
  };
}

/**
 * Look at a target position from an offset
 */
export function lookAtPosition(
  viewer: CesiumViewer,
  target: Position,
  offset: { heading?: number; pitch?: number; range?: number } = {},
): void {
  const center = createCartesian3(
    target.longitude,
    target.latitude,
    target.height || 0,
  );
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  const headingPitchRange = createHeadingPitchRange(
    offset.heading || 0,
    offset.pitch || -45,
    offset.range || 1000,
  );
  viewer.camera.lookAtTransform(transform, headingPitchRange);
}

/**
 * Get camera view rectangle (visible bounds)
 */
export function getCameraViewRectangle(viewer: CesiumViewer): {
  west: number;
  south: number;
  east: number;
  north: number;
} | null {
  const rectangle = viewer.camera.computeViewRectangle();
  if (!rectangle) {
    return null;
  }

  return {
    west: Cesium.Math.toDegrees(rectangle.west),
    south: Cesium.Math.toDegrees(rectangle.south),
    east: Cesium.Math.toDegrees(rectangle.east),
    north: Cesium.Math.toDegrees(rectangle.north),
  };
}

/**
 * Fly camera to view a bounding box containing multiple positions
 * @param viewer - The Cesium viewer
 * @param positions - Array of positions to include in the view
 * @param offsetMultiplier - Multiplier for the bounding box offset (default: 1.5)
 * @param duration - Animation duration in seconds (default: 2)
 */
export function flyToBoundingBox(
  viewer: CesiumViewer,
  positions: Position[],
  offsetMultiplier: number = 1.5,
  duration: number = 2,
): void {
  if (!positions || positions.length === 0) {
    return;
  }

  // Convert positions to Cartesian3
  const cartesians = positions.map((pos) =>
    createCartesian3(pos.longitude, pos.latitude, pos.height || 0),
  );

  // Create a bounding sphere from all positions
  const boundingSphere = Cesium.BoundingSphere.fromPoints(cartesians);

  // Calculate camera offset based on bounding sphere radius
  const offset = new Cesium.HeadingPitchRange(
    0,
    toRadians(-45),
    boundingSphere.radius * offsetMultiplier,
  );

  viewer.camera.flyToBoundingSphere(boundingSphere, {
    offset,
    duration,
  });
}

/**
 * Reset camera transform to world coordinates
 */
export function resetCameraTransform(viewer: CesiumViewer): void {
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}
