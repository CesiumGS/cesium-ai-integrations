/**
 * Cesium Animation Manager Module
 * Handles clock configuration, timeline management, and animation state
 */

import type {
  MCPCommand,
  MCPCommandResult,
  CommandHandler,
  ManagerInterface,
  ClockConfig,
  JulianDate,
  ColorRGBA,
  PositionSample,
  AnimationState
} from '../types/mcp.js';
import type { CesiumViewer } from '../types/cesium-types.js';

import { 
  parseJulianDate, 
  formatJulianDate, 
  parseClockRange, 
  parseClockStep,
  positionToCartesian3,
  createHeadingPitchRange,
  parseColor,
  setClockMultiplier,
  setClockShouldAnimate,
  setClockCurrentTime,
  configureClockTimes,
  updateTimeline,
  decimateArray
} from '../shared/cesium-utils.js';
import { removeEntityById, addAnimatedModelEntity } from '../shared/entity-utils.js';
import { resetCameraTransform } from '../shared/camera-utils.js';

class CesiumAnimationManager implements ManagerInterface {
  viewer: CesiumViewer;
  private animations: Map<string, AnimationState>;
  private modelBasePath: string;
  private readonly MODEL_FILES: Record<string, string> = {
    cesium_man: 'cesium_man.glb',
    car: 'car.glb',
    bike: 'Curiosity.glb',
    airplane: 'airplane.glb'
  };

  constructor(viewer: CesiumViewer, modelBasePath: string = './public/models') {
    this.viewer = viewer;
    this.animations = new Map();
    this.modelBasePath = modelBasePath.endsWith('/') ? modelBasePath.slice(0, -1) : modelBasePath;
  }

  /**
   * Helper function to wrap operations in try-catch and return MCPCommandResult
   */
  private wrapOperation(operation: () => MCPCommandResult): MCPCommandResult {
    try {
      return operation();
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Helper function to get and validate entity by ID
   */
  private getEntity(entityId: string): any | null {
    return this.viewer.entities.getById(entityId);
  }

  /**
   * Helper function to get and validate animation state
   */
  private getAnimationState(animationId: string): AnimationState | null {
    return this.animations.get(animationId) || null;
  }

  /**
   * Helper function to extract parameter from MCPCommand with type safety
   */
  private getParam<T>(cmd: MCPCommand, key: string, defaultValue?: T): T {
    const value = cmd[key];
    if (value === undefined && defaultValue !== undefined) {
      return defaultValue;
    }
    return value as T;
  }

  private getModelUri(modelName: string): string {
    const fileName = this.MODEL_FILES[modelName];
    if (!fileName) {
      throw new Error(`Unknown model: ${modelName}`);
    }
    return `${this.modelBasePath}/${fileName}`;
  }

  /**
   * Setup and initialize the manager
   */
  setUp(): void {
    setClockShouldAnimate(this.viewer, true);
  }

  configure(clockConfig: ClockConfig): MCPCommandResult {
    return this.wrapOperation(() => {
      const clock = this.viewer.clock;

      // Parse Julian dates using shared utility
      const startTime = parseJulianDate(clockConfig.startTime);
      const stopTime = parseJulianDate(clockConfig.stopTime);
      const currentTime = parseJulianDate(clockConfig.currentTime);

      // Configure clock
      clock.startTime = startTime;
      clock.stopTime = stopTime;
      clock.currentTime = currentTime;

      // Set clock range using shared utility
      clock.clockRange = parseClockRange(clockConfig.clockRange);

      // Set clock step using shared utility
      if (clockConfig.clockStep) {
        clock.clockStep = parseClockStep(clockConfig.clockStep);
      }

      // Set multiplier and animation state
      if (clockConfig.multiplier !== undefined) {
        setClockMultiplier(this.viewer, clockConfig.multiplier);
      }

      if (clockConfig.shouldAnimate !== undefined) {
        setClockShouldAnimate(this.viewer, clockConfig.shouldAnimate);
      }

      // Update timeline if available
      updateTimeline(this.viewer, startTime, stopTime);

      return {
        success: true,
        message: `Clock configured with range ${formatJulianDate(startTime)} to ${formatJulianDate(stopTime)}`,
        clockState: {
          startTime: clockConfig.startTime,
          stopTime: clockConfig.stopTime,
          currentTime: clockConfig.currentTime,
          clockRange: clockConfig.clockRange,
          multiplier: clock.multiplier,
          shouldAnimate: clock.shouldAnimate
        }
      };
    });
  }

  /**
   * Set the current time of the animation clock
   */
  setTime(currentTime: string | JulianDate): MCPCommandResult {
    return this.wrapOperation(() => {
      setClockCurrentTime(this.viewer, currentTime);
      const time = parseJulianDate(currentTime);

      return {
        success: true,
        message: `Clock time set to ${formatJulianDate(time)}`,
        currentTime: currentTime
      };
    });
  }

  /**
   * Set the clock multiplier for speed control
   */
  setMultiplier(multiplier: number): MCPCommandResult {
    return this.wrapOperation(() => {
      setClockMultiplier(this.viewer, multiplier);

      return {
        success: true,
        message: `Clock multiplier set to ${multiplier}x real time`,
        multiplier: multiplier
      };
    });
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    // Cleanup if needed
  }

  /**
   * Get animation statistics
   */
  getStats(): { clockRunning: boolean } {
    return {
      clockRunning: this.viewer.clock.shouldAnimate
    };
  }

  /**
   * Zoom timeline to a specific time range
   */
  zoomTimeline(startTime: string | JulianDate, stopTime: string | JulianDate): MCPCommandResult {
    return this.wrapOperation(() => {
      const start = parseJulianDate(startTime);
      const stop = parseJulianDate(stopTime);

      updateTimeline(this.viewer, start, stop);

      return {
        success: true,
        message: `Timeline zoomed to range`
      };
    });
  }

  /**
   * Create animation from route
   */
  createAnimationFromRoute(cmd: MCPCommand): MCPCommandResult {
    return this.wrapOperation(() => {
      const animationId = this.getParam<string>(cmd, 'animationId');
      const entityId = this.getParam<string>(cmd, 'entityId');
      const positionSamples = this.getParam<PositionSample[]>(cmd, 'positionSamples');
      const startTime = this.getParam<string | JulianDate>(cmd, 'startTime');
      const stopTime = this.getParam<string | JulianDate>(cmd, 'stopTime');
      const modelPreset = this.getParam<string>(cmd, 'modelPreset');
      const showPath = this.getParam<boolean>(cmd, 'showPath');
      const speedMultiplier = this.getParam<number>(cmd, 'speedMultiplier', 10);
      const autoPlay = this.getParam<boolean>(cmd, 'autoPlay');
      const trackCamera = this.getParam<boolean>(cmd, 'trackCamera');

      // Decimate position samples if too many (prevents memory issues in Cesium geometry creation)
      const originalLength = positionSamples.length;
      const decimatedSamples = decimateArray<PositionSample>(positionSamples, 500);
      
      if (decimatedSamples.length < originalLength) {
        console.log(`[Animation] Decimated ${originalLength} samples to ${decimatedSamples.length} to prevent memory overflow`);
      }

      // Create SampledPositionProperty from position samples
      const positionProperty = new Cesium.SampledPositionProperty();
      for (const sample of decimatedSamples) {
        const time = parseJulianDate(sample.time);
        const position = positionToCartesian3(sample);
        positionProperty.addSample(time, position);
      }
      
      // Set interpolation
      positionProperty.setInterpolationOptions({
        interpolationDegree: 2,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
      });

      // Get model URI from preset
      const modelUri = this.getModelUri(modelPreset);

      // Create animated model entity using shared utility
      const entity = addAnimatedModelEntity(
        this.viewer,
        positionProperty,
        modelUri,
        {
          id: entityId,
          showPath: showPath,
          minimumPixelSize: 128,
          scale: 1.0
        }
      );

      // Verify entity has model
      if (!entity.model) {
        console.error('[Animation] Entity model is undefined!');
      }

      // Configure clock using shared utility
      const { start, stop } = configureClockTimes(this.viewer, startTime, stopTime, startTime, 'LOOP_STOP');
      setClockMultiplier(this.viewer, speedMultiplier);

      if (autoPlay) {
        setClockShouldAnimate(this.viewer, true);
      }

      // Track with camera if requested
      if (trackCamera) {
        this.viewer.trackedEntity = entity;
      }

      // Store animation state
      this.animations.set(animationId, {
        entityId,
        startTime,
        stopTime,
        modelPreset,
        entity
      });

      // Update timeline
      updateTimeline(this.viewer, start, stop);

      return {
        success: true,
        message: `Animation created with ${decimatedSamples.length} samples`,
        animationId,
        entityId
      };
    });
  }

  /**
   * Play animation
   */
  playAnimation(): MCPCommandResult {
    return this.wrapOperation(() => {
      setClockShouldAnimate(this.viewer, true);
      return {
        success: true,
        message: 'Animation playing'
      };
    });
  }

  /**
   * Pause animation
   */
  pauseAnimation(): MCPCommandResult {
    return this.wrapOperation(() => {
      setClockShouldAnimate(this.viewer, false);
      return {
        success: true,
        message: 'Animation paused'
      };
    });
  }

  /**
   * Update animation speed
   */
  updateAnimationSpeed(cmd: MCPCommand): MCPCommandResult {
    return this.wrapOperation(() => {
      // Get multiplier from cmd.multiplier (not speedMultiplier)
      const multiplier = this.getParam<number>(cmd, 'multiplier') ?? this.getParam<number>(cmd, 'speedMultiplier');
      
      if (multiplier === undefined || multiplier === null) {
        throw new Error('Speed multiplier is required');
      }
      
      setClockMultiplier(this.viewer, multiplier);
      return {
        success: true,
        message: `Speed set to ${multiplier}x`
      };
    });
  }

  /**
   * Remove animation
   */
  removeAnimation(cmd: MCPCommand): MCPCommandResult {
    return this.wrapOperation(() => {
      const animationId = this.getParam<string>(cmd, 'animationId');
      const entityId = this.getParam<string>(cmd, 'entityId');
      
      try {
        // Check if entity exists in viewer before trying to remove
        const entity = this.getEntity(entityId);
        
        if (entity) {
          // Use shared utility for entity removal
          removeEntityById(this.viewer, entityId);
        } else {
          console.warn(`[Animation] Entity ${entityId} not found in viewer, cleaning up state only`);
        }
        
        // Always clean up our local state
        this.animations.delete(animationId);
        
        // Untrack if this was the tracked entity
        if (this.viewer.trackedEntity && this.viewer.trackedEntity.id === entityId) {
          this.viewer.trackedEntity = undefined;
        }
        
        return {
          success: true,
          message: `Animation ${animationId} removed`
        };
      } catch (error: unknown) {
        // Even on error, try to clean up state
        this.animations.delete(animationId);
        throw error;
      }
    });
  }

  /**
   * Configure path visualization
   */
  configureAnimationPath(cmd: MCPCommand): MCPCommandResult {
    return this.wrapOperation(() => {
      const animationId = this.getParam<string>(cmd, 'animationId');
      const leadTime = this.getParam<number | undefined>(cmd, 'leadTime');
      const trailTime = this.getParam<number | undefined>(cmd, 'trailTime');
      const width = this.getParam<number | undefined>(cmd, 'width');
      const color = this.getParam<string | ColorRGBA | undefined>(cmd, 'color');
      
      const anim = this.getAnimationState(animationId);
      
      if (!anim) {
        return { success: false, error: 'Animation not found' };
      }
      
      const entity = this.getEntity(anim.entityId);
      if (!entity) {
        return { success: false, error: 'Entity not found' };
      }
      
      if (entity.path) {
        if (leadTime !== undefined) {
          entity.path.leadTime = leadTime;
        }
        if (trailTime !== undefined) {
          entity.path.trailTime = trailTime;
        }
        if (width !== undefined) {
          entity.path.width = width;
        }
        if (color) {
          const cesiumColor = parseColor(color, Cesium.Color.LIME);
          if (cesiumColor) {
            entity.path.material = new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.1,
              color: cesiumColor
            });
          }
        }
      } else {
        console.warn('[Animation] Entity has no path property');
      }
      
      return {
        success: true,
        message: 'Path configuration updated'
      };
    });
  }

  /**
   * Track entity with camera
   */
  trackAnimationEntity(cmd: MCPCommand): MCPCommandResult {
    return this.wrapOperation(() => {
      const entityId = this.getParam<string>(cmd, 'entityId');
      const range = this.getParam<number | undefined>(cmd, 'range');
      const pitch = this.getParam<number | undefined>(cmd, 'pitch');
      const heading = this.getParam<number | undefined>(cmd, 'heading');
      
      const entity = this.getEntity(entityId);
      if (!entity) {
        return { success: false, error: 'Entity not found' };
      }
      
      this.viewer.trackedEntity = entity;
      
      // Set camera offset if provided
      if (range !== undefined || pitch !== undefined || heading !== undefined) {
        setTimeout(() => {
          this.viewer.trackedEntity = entity;
          const pitchVal = pitch !== undefined ? pitch : -45;
          const headingVal = heading !== undefined ? heading : 0;
          const rangeVal = range ?? 1000;
          
          this.viewer.camera.lookAt(
            entity.position.getValue(this.viewer.clock.currentTime),
            createHeadingPitchRange(headingVal, pitchVal, rangeVal)
          );
        }, 100);
      }
      
      return {
        success: true,
        message: `Tracking entity ${entityId}`
      };
    });
  }

  /**
   * Untrack camera
   */
  untrackCamera(): MCPCommandResult {
    return this.wrapOperation(() => {
      this.viewer.trackedEntity = undefined;
      resetCameraTransform(this.viewer);
      
      return {
        success: true,
        message: 'Camera untracked'
      };
    });
  }

  /**
   * List all active animations
   */
  listActiveAnimations(): MCPCommandResult {
    return this.wrapOperation(() => {
      const activeAnimations = Array.from(this.animations.entries()).map(([animationId, anim]) => {
        const entity = this.getEntity(anim.entityId);
        const isTracked = this.viewer.trackedEntity && this.viewer.trackedEntity.id === anim.entityId;
        
        return {
          animationId,
          entityId: anim.entityId,
          startTime: anim.startTime,
          stopTime: anim.stopTime,
          modelPreset: anim.modelPreset,
          exists: !!entity,
          isTracked,
          hasPath: entity ? !!entity.path : false
        };
      });
      
      return {
        success: true,
        message: `Found ${activeAnimations.length} active animation(s)`,
        animations: activeAnimations,
        clockState: {
          currentTime: formatJulianDate(this.viewer.clock.currentTime),
          multiplier: this.viewer.clock.multiplier,
          shouldAnimate: this.viewer.clock.shouldAnimate
        }
      };
    });
  }

  /**
   * Set globe lighting effects
   */
  setGlobeLighting(
    enableLighting: boolean,
    enableDynamicAtmosphere: boolean = true,
    enableSunLighting: boolean = true
  ): MCPCommandResult {
    return this.wrapOperation(() => {
      const scene = this.viewer.scene;

      scene.globe.enableLighting = enableLighting;

      if (enableLighting) {
        scene.globe.dynamicAtmosphereLighting = enableDynamicAtmosphere;
        scene.globe.dynamicAtmosphereLightingFromSun = enableSunLighting;
      } else {
        scene.globe.dynamicAtmosphereLighting = false;
        scene.globe.dynamicAtmosphereLightingFromSun = false;
      }

      const message = enableLighting
        ? `Globe lighting enabled (atmosphere: ${enableDynamicAtmosphere}, sun: ${enableSunLighting})`
        : 'Globe lighting disabled';

      return {
        success: true,
        message: message,
        lightingState: {
          enableLighting,
          enableDynamicAtmosphere: enableLighting ? enableDynamicAtmosphere : false,
          enableSunLighting: enableLighting ? enableSunLighting : false
        }
      };
    });
  }

  /**
   * Get command handlers for this manager
   */
  getCommandHandlers(): Map<string, CommandHandler> {
    const handlers = new Map<string, CommandHandler>();

    // Clock commands
    handlers.set('clock_configure', (cmd: MCPCommand) => {
      return this.configure(cmd.clock as ClockConfig);
    });

    handlers.set('clock_set_time', (cmd: MCPCommand) => {
      return this.setTime(cmd.currentTime as string | JulianDate);
    });

    handlers.set('clock_multiplier', (cmd: MCPCommand) => {
      return this.setMultiplier(cmd.multiplier as number);
    });

    // Timeline commands
    handlers.set('timeline_zoom_to_range', (cmd: MCPCommand) => {
      return this.zoomTimeline(cmd.startTime as string | JulianDate, cmd.stopTime as string | JulianDate);
    });

    handlers.set('timeline_zoom', (cmd: MCPCommand) => {
      return this.zoomTimeline(cmd.startTime as string | JulianDate, cmd.stopTime as string | JulianDate);
    });

    // Animation commands (matching tool names from animation-server)
    handlers.set('animation_create_from_route', (cmd: MCPCommand) => {
      return this.createAnimationFromRoute(cmd);
    });

    handlers.set('animation_create_custom_path', (cmd: MCPCommand) => {
      return this.createAnimationFromRoute(cmd);
    });

    handlers.set('animation_play', () => {
      return this.playAnimation();
    });

    handlers.set('animation_pause', () => {
      return this.pauseAnimation();
    });

    handlers.set('animation_update_speed', (cmd: MCPCommand) => {
      return this.updateAnimationSpeed(cmd);
    });

    handlers.set('animation_remove', (cmd: MCPCommand) => {
      return this.removeAnimation(cmd);
    });

    handlers.set('animation_configure_path', (cmd: MCPCommand) => {
      return this.configureAnimationPath(cmd);
    });

    handlers.set('animation_track_entity', (cmd: MCPCommand) => {
      return this.trackAnimationEntity(cmd);
    });

    handlers.set('animation_untrack_camera', () => {
      return this.untrackCamera();
    });

    handlers.set('animation_list_active', () => {
      return this.listActiveAnimations();
    });

    handlers.set('globe_lighting', (cmd: MCPCommand) => {
      return this.setGlobeLighting(
        cmd.enableLighting as boolean,
        cmd.enableDynamicAtmosphere as boolean | undefined,
        cmd.enableSunLighting as boolean | undefined
      );
    });

    return handlers;
  }
}

export default CesiumAnimationManager;
