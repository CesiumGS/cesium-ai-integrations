/**
 * Animation tool constants and default values
 */

import { ModelEntry, ModelPresetType } from "./types.js";

/**
 * Default timeout for operations (ms)
 */
export const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Timeout for long operations (ms)
 */
export const LONG_TIMEOUT_MS = 15000;

/**
 * Default animation settings
 */
export const DEFAULT_SPEED_MULTIPLIER = 10;
export const DEFAULT_PATH_WIDTH = 3;
export const DEFAULT_PATH_RESOLUTION = 60;
export const DEFAULT_MODEL_SCALE = 1;
export const DEFAULT_MODEL_PIXEL_SIZE = 64;
export const DEFAULT_CAMERA_TRACKING_RANGE = 1000;
export const DEFAULT_CAMERA_TRACKING_PITCH = -45;
export const DEFAULT_CAMERA_TRACKING_HEADING = 0;

/**
 * Maximum size for position sample arrays to prevent memory issues
 */
export const MAX_POSITION_SAMPLES = 500;

/**
 * Map travel modes to model presets
 * Used by getModelPresetFromTravelMode() to auto-select models based on travel mode
 * See: TravelModeSchema in core-schemas.ts for valid travel modes
 */
export const TRAVEL_MODE_TO_MODEL: Record<string, string> = {
  walking: "cesium_man",
  driving: "ground_vehicle",
  cycling: "cesium_man",
  bicycling: "cesium_man",
  transit: "ground_vehicle",
  flying: "cesium_air",
} as const;

/**
 * Default model registry mapping preset names to their URIs
 */
export const DEFAULT_MODEL_REGISTRY: Record<ModelPresetType, ModelEntry> = {
  cesium_man: {
    uri: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumMan/Cesium_Man.glb',
    description: 'Walking person model',
    recommendedFor: ['walking', 'hiking', 'pedestrian']
  },
  cesium_air: {
    uri: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumAir/Cesium_Air.glb',
    description: 'Aircraft model',
    recommendedFor: ['flying', 'flight', 'aircraft']
  },
  ground_vehicle: {
    uri: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/GroundVehicle/GroundVehicle.glb',
    description: 'Car/vehicle model',
    recommendedFor: ['driving', 'cycling', 'bicycling', 'car', 'vehicle']
  },
  cesium_drone: {
    uri: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumDrone/CesiumDrone.glb',
    description: 'Drone model',
    recommendedFor: ['drone', 'quad-copter', 'aerial']
  },
  custom: {
    uri: '',
    description: 'Custom model URI (must be provided by user)',
  }
};

