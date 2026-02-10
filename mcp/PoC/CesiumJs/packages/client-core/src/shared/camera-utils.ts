/**
 * Shared Camera Utilities
 * Helper functions for camera control and positioning
 */

import type { Position, CameraOrientation } from '../types/mcp.js';
import { 
  createCartesian3, 
  toRadians, 
  createHeadingPitchRange,
  parseEasingFunction 
} from './cesium-utils.js';

/**
 * Fly camera to position with animation
 * Uses Cesium's idiomatic callback pattern for complete and cancel events
 */
export function flyToPosition(
  viewer: any,
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
  } = {}
): void {
  const flyToOptions: any = {
    destination: createCartesian3(position.longitude, position.latitude, position.height || 0),
    orientation: {
      heading: toRadians(orientation.heading || 0),
      pitch: toRadians(orientation.pitch || -15),
      roll: toRadians(orientation.roll || 0)
    },
    duration: duration
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
  viewer: any,
  position: Position,
  orientation: CameraOrientation = {}
): void {
  viewer.camera.setView({
    destination: createCartesian3(position.longitude, position.latitude, position.height || 0),
    orientation: {
      heading: toRadians(orientation.heading || 0),
      pitch: toRadians(orientation.pitch || -15),
      roll: toRadians(orientation.roll || 0)
    }
  });
}

/**
 * Get current camera position and orientation
 */
export function getCameraPosition(viewer: any): {
  position: Position;
  orientation: CameraOrientation;
} {
  const camera = viewer.camera;
  const cartographic = camera.positionCartographic;

  return {
    position: {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height
    },
    orientation: {
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll)
    }
  };
}

/**
 * Look at a target position from an offset
 */
export function lookAtPosition(
  viewer: any,
  target: Position,
  offset: { heading?: number; pitch?: number; range?: number } = {}
): void {
  const center = createCartesian3(target.longitude, target.latitude, target.height || 0);
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  const headingPitchRange = createHeadingPitchRange(
    offset.heading || 0,
    offset.pitch || -45,
    offset.range || 1000
  );
  viewer.camera.lookAtTransform(transform, headingPitchRange);
}

/**
 * Reset camera look-at transform to default
 */
export function resetCameraTransform(viewer: any): void {
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}

/**
 * Look at a target position with automatic cleanup
 * Returns a cleanup function to reset the transform
 */
export function lookAtPositionWithCleanup(
  viewer: any,
  target: Position,
  offset: { heading?: number; pitch?: number; range?: number } = {}
): () => void {
  lookAtPosition(viewer, target, offset);
  return () => resetCameraTransform(viewer);
}

/**
 * Fly to view multiple positions (bounding box)
 * Calculates the bounding rectangle from position array
 */
export function flyToBoundingBox(
  viewer: any,
  positions: Position[],
  duration: number = 2
): void {
  if (positions.length === 0) {
    console.warn('flyToBoundingBox: No positions provided');
    return;
  }

  // Calculate bounding rectangle from positions
  let west = positions[0].longitude;
  let south = positions[0].latitude;
  let east = positions[0].longitude;
  let north = positions[0].latitude;
  
  positions.forEach(p => {
    west = Math.min(west, p.longitude);
    south = Math.min(south, p.latitude);
    east = Math.max(east, p.longitude);
    north = Math.max(north, p.latitude);
  });
  
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
    duration: duration
  });
}

/**
 * Zoom camera to entity or entities
 */
export function zoomToEntity(viewer: any, entity: any, offset?: any): Promise<void> {
  return new Promise((resolve) => {
    viewer.zoomTo(entity, offset).then(() => resolve());
  });
}

/**
 * Get camera view rectangle (visible bounds)
 */
export function getCameraViewRectangle(viewer: any): {
  west: number;
  south: number;
  east: number;
  north: number;
} | null {
  const rectangle = viewer.camera.computeViewRectangle();
  if (!rectangle) return null;

  return {
    west: Cesium.Math.toDegrees(rectangle.west),
    south: Cesium.Math.toDegrees(rectangle.south),
    east: Cesium.Math.toDegrees(rectangle.east),
    north: Cesium.Math.toDegrees(rectangle.north)
  };
}
