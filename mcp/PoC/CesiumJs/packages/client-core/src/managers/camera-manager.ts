/**
 * Cesium Camera Control Module
 * Handles all camera-related operations including movement, positioning, and advanced controls
 */

import type {
  MCPCommand,
  CommandHandler,
  ManagerInterface,
  CameraOrientation,
  CameraFlyToOptions,
  CameraPosition,
  CameraFlyToResult,
  CameraViewResult,
  CameraPositionResult,
  CameraOrbitResult,
  CameraTargetResult,
  CameraControllerResult,
  CameraLookAtOffset,
  CameraControllerOptions,
} from "../types/mcp.js";
import type { CesiumViewer } from "../types/cesium-types.js";

import {
  flyToPosition,
  setCameraView,
  getCameraPosition,
  lookAtPosition,
  getCameraViewRectangle,
} from "../shared/camera-utils.js";
import {
  validateLongitude,
  validateLatitude,
  validateHeight,
} from "../shared/validation-utils.js";
import { getErrorMessage } from "../shared/error-utils.js";
import {
  DEFAULT_ORBIT_SPEED,
  DEFAULT_CAMERA_PITCH,
  DEFAULT_CAMERA_HEADING,
  DEFAULT_CAMERA_ROLL,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_FLY_DURATION,
} from "../shared/constants.js";

class CesiumCameraManager implements ManagerInterface {
  viewer: CesiumViewer;
  orbitSpeed: number;
  orbitHandler: (() => void) | null;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
    this.orbitSpeed = 0;
    this.orbitHandler = null;
  }

  /**
   * Setup and initialize the manager
   */
  async setUp(): Promise<void> {
    return new Promise<void>((resolve) => {
      flyToPosition(
        this.viewer,
        DEFAULT_CAMERA_POSITION,
        {
          heading: DEFAULT_CAMERA_HEADING,
          pitch: DEFAULT_CAMERA_PITCH,
          roll: DEFAULT_CAMERA_ROLL,
        },
        DEFAULT_FLY_DURATION,
        { complete: () => resolve() },
      );
    });
  }

  /**
   * Fly camera to a specific position with advanced options
   */
  async flyTo(
    longitude: number,
    latitude: number,
    height: number,
    orientation: CameraOrientation = {},
    duration: number = 3,
    options: CameraFlyToOptions = {},
  ): Promise<CameraFlyToResult> {
    try {
      // Validate inputs
      const lonCheck = validateLongitude(longitude);
      if (!lonCheck.valid) {
        return { success: false, error: lonCheck.error ?? "Invalid longitude" };
      }

      const latCheck = validateLatitude(latitude);
      if (!latCheck.valid) {
        return { success: false, error: latCheck.error ?? "Invalid latitude" };
      }

      const heightCheck = validateHeight(height);
      if (!heightCheck.valid) {
        return { success: false, error: heightCheck.error ?? "Invalid height" };
      }

      let completed = false;
      let cancelled = false;

      await new Promise<void>((resolve) => {
        flyToPosition(
          this.viewer,
          { longitude, latitude, height },
          orientation,
          duration,
          {
            ...options,
            complete: () => {
              completed = true;
              resolve();
            },
            cancel: () => {
              cancelled = true;
              resolve();
            },
          },
        );
      });

      const result: CameraFlyToResult = {
        success: completed,
        position: { longitude, latitude, height },
        orientation: orientation,
        actualDuration: duration,
        cancelled: cancelled,
      };
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: `Camera flight failed: ${getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Instantly set camera view without animation
   */
  setView(
    longitude: number,
    latitude: number,
    height: number,
    orientation: CameraOrientation = {},
  ): CameraViewResult {
    try {
      // Validate inputs
      const lonCheck = validateLongitude(longitude);
      if (!lonCheck.valid) {
        return { success: false, error: lonCheck.error ?? "Invalid longitude" };
      }

      const latCheck = validateLatitude(latitude);
      if (!latCheck.valid) {
        return { success: false, error: latCheck.error ?? "Invalid latitude" };
      }

      const heightCheck = validateHeight(height);
      if (!heightCheck.valid) {
        return { success: false, error: heightCheck.error ?? "Invalid height" };
      }

      setCameraView(this.viewer, { longitude, latitude, height }, orientation);
      const result: CameraViewResult = {
        success: true,
        position: { longitude, latitude, height },
        orientation: orientation,
      };
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: `Failed to set camera view: ${getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Get current camera position and comprehensive view information
   */
  getCurrentPosition(): CameraPositionResult {
    try {
      const cameraData = getCameraPosition(this.viewer);
      const viewRectangle = getCameraViewRectangle(this.viewer);

      const result: CameraPositionResult = {
        success: true,
        position: {
          longitude: cameraData.position.longitude,
          latitude: cameraData.position.latitude,
          height: cameraData.position.height ?? 0,
        },
        orientation: cameraData.orientation,
        viewRectangle: viewRectangle,
        altitude: cameraData.position.height ?? 0,
      };
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Lock camera to look at a specific target point
   */
  lookAtTransform(
    targetLon: number,
    targetLat: number,
    targetHeight: number,
    offset: CameraLookAtOffset = {},
  ): CameraTargetResult {
    try {
      lookAtPosition(
        this.viewer,
        { longitude: targetLon, latitude: targetLat, height: targetHeight },
        offset,
      );
      const result: CameraTargetResult = {
        success: true,
        target: {
          longitude: targetLon,
          latitude: targetLat,
          height: targetHeight,
        },
        offset: offset,
      };
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Start camera orbit around current target
   */
  startOrbit(speed?: number): CameraOrbitResult {
    try {
      this.stopOrbit(); // Stop any existing orbit

      this.orbitSpeed = speed ?? DEFAULT_ORBIT_SPEED;
      this.orbitHandler = this.viewer.clock.onTick.addEventListener(() => {
        this.viewer.scene.camera.rotateRight(this.orbitSpeed);
      });

      const result: CameraOrbitResult = {
        success: true,
        orbitActive: true,
      };
      if (speed !== undefined) {
        result.speed = speed;
      }
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
        orbitActive: false,
      };
    }
  }

  /**
   * Stop camera orbit
   */
  stopOrbit(): CameraOrbitResult {
    try {
      if (this.orbitHandler) {
        this.orbitHandler();
        this.orbitHandler = null;
      }
      this.orbitSpeed = 0;

      const result: CameraOrbitResult = {
        success: true,
        orbitActive: false,
      };
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
        orbitActive: false,
      };
    }
  }

  /**
   * Configure camera controller options and constraints
   */
  setControllerOptions(
    options: CameraControllerOptions = {},
  ): CameraControllerResult {
    try {
      const controller = this.viewer.scene.screenSpaceCameraController;

      if (options.enableCollisionDetection !== undefined) {
        controller.enableCollisionDetection = options.enableCollisionDetection;
      }
      if (options.minimumZoomDistance !== undefined) {
        controller.minimumZoomDistance = options.minimumZoomDistance;
      }
      if (options.maximumZoomDistance !== undefined) {
        controller.maximumZoomDistance = options.maximumZoomDistance;
      }
      if (options.enableTilt !== undefined) {
        controller.enableTilt = options.enableTilt;
      }
      if (options.enableRotate !== undefined) {
        controller.enableRotate = options.enableRotate;
      }
      if (options.enableTranslate !== undefined) {
        controller.enableTranslate = options.enableTranslate;
      }
      if (options.enableZoom !== undefined) {
        controller.enableZoom = options.enableZoom;
      }
      if (options.enableLook !== undefined) {
        controller.enableLook = options.enableLook;
      }

      // Return current settings
      const currentSettings = {
        enableCollisionDetection: controller.enableCollisionDetection,
        minimumZoomDistance: controller.minimumZoomDistance,
        maximumZoomDistance: controller.maximumZoomDistance,
        enableTilt: controller.enableTilt,
        enableRotate: controller.enableRotate,
        enableTranslate: controller.enableTranslate,
        enableZoom: controller.enableZoom,
        enableLook: controller.enableLook,
      };

      const result: CameraControllerResult = {
        success: true,
        settings: currentSettings,
      };
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    this.stopOrbit();
  }

  /**
   * Get command handlers for this manager
   */
  getCommandHandlers(): Map<string, CommandHandler> {
    const handlers = new Map<string, CommandHandler>();

    handlers.set("camera_fly_to", async (cmd: MCPCommand) => {
      const destination = cmd.destination as unknown as CameraPosition;
      return await this.flyTo(
        destination.longitude,
        destination.latitude,
        destination.height,
        (cmd.orientation as CameraOrientation | undefined) ?? {},
        (cmd.duration as number | undefined) ?? DEFAULT_FLY_DURATION,
        {
          easingFunction: cmd.easingFunction as string | undefined,
          maximumHeight: cmd.maximumHeight as number | undefined,
          pitchAdjustHeight: cmd.pitchAdjustHeight as number | undefined,
          flyOverLongitude: cmd.flyOverLongitude as number | undefined,
          flyOverLongitudeWeight: cmd.flyOverLongitudeWeight as
            | number
            | undefined,
        },
      );
    });

    handlers.set("camera_set_view", (cmd: MCPCommand) => {
      const destination = cmd.destination as unknown as CameraPosition;
      return this.setView(
        destination.longitude,
        destination.latitude,
        destination.height,
        (cmd.orientation as CameraOrientation | undefined) ?? {},
      );
    });

    handlers.set("camera_get_position", () => {
      return this.getCurrentPosition();
    });

    handlers.set("camera_look_at_transform", (cmd: MCPCommand) => {
      const target = cmd.target as unknown as CameraPosition;
      return this.lookAtTransform(
        target.longitude,
        target.latitude,
        target.height,
        (cmd.offset as CameraLookAtOffset | undefined) ?? {},
      );
    });

    handlers.set("camera_start_orbit", (cmd: MCPCommand) => {
      const speed = typeof cmd.speed === "number" ? cmd.speed : undefined;
      return this.startOrbit(speed);
    });

    handlers.set("camera_stop_orbit", () => {
      return this.stopOrbit();
    });

    handlers.set("camera_set_controller_options", (cmd: MCPCommand) => {
      return this.setControllerOptions(cmd.options as CameraControllerOptions);
    });

    return handlers;
  }
}

export default CesiumCameraManager;
