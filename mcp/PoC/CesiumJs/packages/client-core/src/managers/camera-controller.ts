/**
 * Cesium Camera Control Module
 * Handles all camera-related operations including movement, positioning, and advanced controls
 */

import type {
  MCPCommand,
  MCPCommandResult,
  CommandHandler,
  ManagerInterface,
  CameraOrientation,
  CameraFlyToOptions
} from '../types/mcp.js';

import { 
  flyToPosition, 
  setCameraView, 
  getCameraPosition,
  lookAtPosition,
  getCameraViewRectangle 
} from '../shared/camera-utils.js';
import { validateLongitude, validateLatitude, validateHeight } from '../shared/validation-utils.js';

class CesiumCameraController implements ManagerInterface {
  viewer: any;
  orbitSpeed: number;
  orbitHandler: (() => void) | null;
  prefix: string;

  constructor(viewer: any) {
    this.viewer = viewer;
    this.orbitSpeed = 0;
    this.orbitHandler = null;
    this.prefix = 'camera';
  }

  /**
   * Setup and initialize the manager
   */
  async setUp(): Promise<void> {
    return new Promise<void>((resolve) => {
      flyToPosition(
        this.viewer, 
        { longitude: 25.2797, latitude: 54.6872, height: 400 },
        { heading: 0, pitch: -15, roll: 0 },
        3,
        { complete: () => resolve() }
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
    options: CameraFlyToOptions = {}
  ): Promise<MCPCommandResult> {
    try {
      // Validate inputs
      const lonCheck = validateLongitude(longitude);
      if (!lonCheck.valid) {
        return { success: false, error: lonCheck.error };
      }
      
      const latCheck = validateLatitude(latitude);
      if (!latCheck.valid) {
        return { success: false, error: latCheck.error };
      }
      
      const heightCheck = validateHeight(height);
      if (!heightCheck.valid) {
        return { success: false, error: heightCheck.error };
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
            }
          }
        );
      });
      
      return {
        success: completed,
        position: { longitude, latitude, height },
        orientation: orientation,
        actualDuration: duration,
        cancelled: cancelled
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Camera flight failed: ${error.message}`
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
    orientation: CameraOrientation = {}
  ): MCPCommandResult {
    try {
      // Validate inputs
      const lonCheck = validateLongitude(longitude);
      if (!lonCheck.valid) {
        return { success: false, error: lonCheck.error };
      }
      
      const latCheck = validateLatitude(latitude);
      if (!latCheck.valid) {
        return { success: false, error: latCheck.error };
      }
      
      const heightCheck = validateHeight(height);
      if (!heightCheck.valid) {
        return { success: false, error: heightCheck.error };
      }
      
      setCameraView(this.viewer, { longitude, latitude, height }, orientation);
      return {
        success: true,
        position: { longitude, latitude, height },
        orientation: orientation
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to set camera view: ${error.message}`
      };
    }
  }

  /**
   * Get current camera position and comprehensive view information
   */
  getCurrentPosition(): MCPCommandResult {
    try {
      const cameraData = getCameraPosition(this.viewer);
      const viewRectangle = getCameraViewRectangle(this.viewer);

      return {
        success: true,
        position: cameraData.position,
        orientation: cameraData.orientation,
        viewRectangle: viewRectangle,
        altitude: cameraData.position.height
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
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
    offset: any = {}
  ): MCPCommandResult {
    try {
      lookAtPosition(
        this.viewer, 
        { longitude: targetLon, latitude: targetLat, height: targetHeight },
        offset
      );
      return {
        success: true,
        target: { longitude: targetLon, latitude: targetLat, height: targetHeight },
        offset: offset
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start camera orbit around current target
   */
  startOrbit(speed: number = 0.005): MCPCommandResult {
    try {
      this.stopOrbit(); // Stop any existing orbit

      this.orbitSpeed = speed;
      this.orbitHandler = this.viewer.clock.onTick.addEventListener(() => {
        this.viewer.scene.camera.rotateRight(this.orbitSpeed);
      });

      return {
        success: true,
        orbitActive: true,
        speed: speed
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        orbitActive: false
      };
    }
  }

  /**
   * Stop camera orbit
   */
  stopOrbit(): MCPCommandResult {
    try {
      if (this.orbitHandler) {
        this.orbitHandler();
        this.orbitHandler = null;
      }
      this.orbitSpeed = 0;

      return {
        success: true,
        orbitActive: false
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        orbitActive: false
      };
    }
  }

  /**
   * Configure camera controller options and constraints
   */
  setControllerOptions(options: any = {}): MCPCommandResult {
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
        enableLook: controller.enableLook
      };

      return {
        success: true,
        settings: currentSettings
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
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

    handlers.set('camera_fly_to', async (cmd: MCPCommand) => {
      return await this.flyTo(
        cmd.destination.longitude,
        cmd.destination.latitude,
        cmd.destination.height,
        cmd.orientation,
        cmd.duration,
        {
          easingFunction: cmd.easingFunction,
          maximumHeight: cmd.maximumHeight,
          pitchAdjustHeight: cmd.pitchAdjustHeight,
          flyOverLongitude: cmd.flyOverLongitude,
          flyOverLongitudeWeight: cmd.flyOverLongitudeWeight
        }
      );
    });

    handlers.set('camera_set_view', (cmd: MCPCommand) => {
      return this.setView(
        cmd.destination.longitude,
        cmd.destination.latitude,
        cmd.destination.height,
        cmd.orientation
      );
    });

    handlers.set('camera_get_position', () => {
      return this.getCurrentPosition();
    });
    
    handlers.set('camera_look_at_transform', (cmd: MCPCommand) => {
      return this.lookAtTransform(
        cmd.target.longitude,
        cmd.target.latitude,
        cmd.target.height,
        cmd.offset
      );
    });
    
    handlers.set('camera_start_orbit', (cmd: MCPCommand) => {
      return this.startOrbit(cmd.speed);
    });
    
    handlers.set('camera_stop_orbit', () => {
      return this.stopOrbit();
    });    handlers.set('camera_set_controller_options', (cmd: MCPCommand) => {
      return this.setControllerOptions(cmd.options);
    });

    return handlers;
  }
}

export default CesiumCameraController;
