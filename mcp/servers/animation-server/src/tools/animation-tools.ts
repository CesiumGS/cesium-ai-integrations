import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ICommunicationServer } from '@cesium-mcp/shared';
import {
  RouteAnimationConfigSchema,
  AnimationConfigSchema,
  PathUpdateConfigSchema,
  CameraTrackingConfigSchema,
  AnimationCreateResponseSchema,
  AnimationStateResponseSchema,
  AnimationListResponseSchema,
  CameraTrackingResponseSchema,
} from '../schemas.js';

/**
 * Animation state tracker
 */
interface AnimationState {
  id: string;
  entityId: string;
  startTime: string;
  stopTime: string;
  currentSpeed: number;
  isPlaying: boolean;
  loopMode: 'none' | 'loop' | 'pingpong';
  createdAt: Date;
}

const animations = new Map<string, AnimationState>();
let trackedEntityId: string | null = null;

/**
 * Map travel modes to model presets
 */
const TRAVEL_MODE_TO_MODEL: Record<string, string> = {
  walking: 'cesium_man',
  driving: 'car',
  cycling: 'bike',
  bicycling: 'bike',
  flying: 'airplane'
};

/**
 * Helper: Parse duration string to milliseconds
 */
function parseDuration(durationStr: string): number {
  const matches = durationStr.match(/(\d+)\s*(min|sec|hour)/i);
  if (!matches) return 60000; // Default 1 minute

  const value = parseInt(matches[1]);
  const unit = matches[2].toLowerCase();

  switch (unit) {
    case 'sec': return value * 1000;
    case 'min': return value * 60000;
    case 'hour': return value * 3600000;
    default: return 60000;
  }
}

/**
 * Helper: Decode Google encoded polyline string to coordinate array
 * Uses Google's encoded polyline algorithm (precision 1e-5)
 */
function decodePolyline(encoded: string): Array<{ longitude: number; latitude: number; height: number }> {
  const positions: Array<{ longitude: number; latitude: number; height: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    positions.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
      height: 0
    });
  }

  return positions;
}

/**
 * Helper: Decimate array to max size while preserving start/end
 * Prevents memory issues from too many position samples
 */
function decimateArray<T>(arr: T[], maxSize: number = 500): T[] {
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
 * Register animation tools with MCP server
 */
export function registerAnimationTools(server: McpServer, communicationServer: ICommunicationServer | undefined): void {
  if (!communicationServer) {
    throw new Error('Animation tools require a communication server for browser visualization');
  }

  // Tool 1: Create animation from geolocation route
  server.registerTool(
    'animation_create_from_route',
    {
      title: 'Create Animation from Route',
      description: 'Create an animated entity following a route. First call geolocation_route tool to get route data, then pass the complete route object to this tool. Auto-selects 3D model (walking→Cesium Man, driving→car, cycling→bike). Supports simple start/end locations or detailed route with legs/steps.',
      inputSchema: RouteAnimationConfigSchema.extend({
        autoPlay: z.boolean().optional().describe('Automatically start animation after creation'),
        trackCamera: z.boolean().optional().describe('Automatically track entity with camera')
      }).shape,
      outputSchema: AnimationCreateResponseSchema.shape
    },
    async (args) => {
      const startTime = Date.now();

      try {

        const validatedArgs = RouteAnimationConfigSchema.parse(args);

        // Validate route data
        if (!validatedArgs.route) {
          throw new Error('Route data is required. Please call geolocation_route first to get route data, then pass it to this tool.');
        }

        // Handle both direct route object and routes array from geolocation_route response
        let routeData = validatedArgs.route as any;
        if (routeData.routes && Array.isArray(routeData.routes) && routeData.routes.length > 0) {
          // Extract primary route from geolocation_route response
          routeData = {
            ...routeData.routes[0],
            travelMode: routeData.primaryRoute?.travelMode || routeData.routes[0].travelMode || 'driving'
          };
        }

        // Auto-select model preset based on travel mode
        let modelPreset: 'cesium_man' | 'car' | 'bike' | 'airplane' = 'cesium_man';
        if (validatedArgs.modelPreset && validatedArgs.modelPreset !== 'auto') {
          modelPreset = validatedArgs.modelPreset as 'cesium_man' | 'car' | 'bike' | 'airplane';
        } else if (routeData.travelMode) {
          const mapped = TRAVEL_MODE_TO_MODEL[routeData.travelMode];
          if (mapped) {
            modelPreset = mapped as 'cesium_man' | 'car' | 'bike' | 'airplane';
          }
        }

        // Generate unique animation ID
        const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const entityId = `animated_entity_${animationId}`;

        // Extract position samples from route
        const positionSamples = [];
        let currentTime = Date.now();

        // Check route format
        const route = routeData;

        if (route.polyline) {
          if (Array.isArray(route.polyline)) {
            // Decoded coordinates array - decimate if too large to prevent memory issues
            const originalLength = route.polyline.length;
            const decimatedPolyline = decimateArray<any>(route.polyline, 500);
            console.error(`Processing ${originalLength} decoded polyline coordinates (decimated to ${decimatedPolyline.length})`);

            const totalDuration = (route.duration || decimatedPolyline.length * 10) * 1000;
            const durationPerSegment = totalDuration / (decimatedPolyline.length - 1);

            for (let i = 0; i < decimatedPolyline.length; i++) {
              const pos = decimatedPolyline[i];
              // Handle both [lon, lat, height] tuples and {longitude, latitude, height} objects
              const longitude = Array.isArray(pos) ? pos[0] : pos.longitude;
              const latitude = Array.isArray(pos) ? pos[1] : pos.latitude;
              const height = Array.isArray(pos) ? (pos[2] || 0) : (pos.height || 0);

              positionSamples.push({
                time: new Date(currentTime).toISOString(),
                longitude,
                latitude,
                height
              });
              if (i < decimatedPolyline.length - 1) {
                currentTime += durationPerSegment / (validatedArgs.speedMultiplier || 10.0);
              }
            }
          } else if (typeof route.polyline === 'string') {
            // Encoded polyline string - decode using Google's algorithm
            const decodedPositions = decodePolyline(route.polyline);
            console.error(`Decoded encoded polyline to ${decodedPositions.length} coordinates`);

            const decimatedPositions = decimateArray<any>(decodedPositions, 500);
            if (decimatedPositions.length < decodedPositions.length) {
              console.error(`Decimated ${decodedPositions.length} decoded polyline points to ${decimatedPositions.length}`);
            }

            const totalDuration = (route.duration || decimatedPositions.length * 10) * 1000;
            const durationPerSegment = totalDuration / (decimatedPositions.length - 1);

            for (let i = 0; i < decimatedPositions.length; i++) {
              const pos = decimatedPositions[i];
              positionSamples.push({
                time: new Date(currentTime).toISOString(),
                longitude: pos.longitude,
                latitude: pos.latitude,
                height: pos.height || 0
              });
              if (i < decimatedPositions.length - 1) {
                currentTime += durationPerSegment / (validatedArgs.speedMultiplier || 10.0);
              }
            }
          }
        } else if (route.positions && Array.isArray(route.positions)) {
          // Direct positions array format - decimate if too large
          const originalLength = route.positions.length;
          const decimatedPositions = decimateArray<any>(route.positions, 500);
          console.error(`Processing ${originalLength} direct positions (decimated to ${decimatedPositions.length})`);

          const totalDuration = (route.duration || decimatedPositions.length * 10) * 1000;
          const durationPerSegment = totalDuration / (decimatedPositions.length - 1);

          for (let i = 0; i < decimatedPositions.length; i++) {
            positionSamples.push({
              time: new Date(currentTime).toISOString(),
              longitude: decimatedPositions[i].longitude,
              latitude: decimatedPositions[i].latitude,
              height: decimatedPositions[i].height || 0
            });
            if (i < decimatedPositions.length - 1) {
              currentTime += durationPerSegment / (validatedArgs.speedMultiplier || 10.0);
            }
          }
        } else if (route.legs && Array.isArray(route.legs) && route.legs.length > 0) {
          // Full route format with legs
          for (const leg of route.legs) {
            // Add leg start location if available
            if (leg.startLocation) {
              positionSamples.push({
                time: new Date(currentTime).toISOString(),
                longitude: leg.startLocation.longitude,
                latitude: leg.startLocation.latitude,
                height: leg.startLocation.height || 0
              });
            }

            // Check if steps have explicit start/end locations (custom format)
            if (leg.steps && leg.steps.length > 0 && leg.steps[0].startLocation && leg.steps[0].endLocation) {
              // Steps have explicit positions - use them
              for (const step of leg.steps) {
                const durationValue = typeof step.duration === 'number' ? step.duration * 1000 : parseDuration(step.duration || '1 min');
                currentTime += durationValue / (validatedArgs.speedMultiplier || 10.0);

                positionSamples.push({
                  time: new Date(currentTime).toISOString(),
                  longitude: step.endLocation!.longitude,
                  latitude: step.endLocation!.latitude,
                  height: step.endLocation!.height || 0
                });
              }
            } else if (leg.steps && leg.steps.length > 0 && leg.startLocation && leg.endLocation) {
              // Steps don't have positions (geolocation format) - interpolate between leg start/end
              const legDuration = leg.duration || leg.steps.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
              const legDistance = leg.distance || leg.steps.reduce((sum: number, s: any) => sum + (s.distance || 0), 0);

              let accumulatedDistance = 0;
              for (const step of leg.steps) {
                accumulatedDistance += step.distance || 0;
                const progress = legDistance > 0 ? accumulatedDistance / legDistance : (accumulatedDistance / leg.steps.length);

                // Linear interpolation between leg start and end
                const longitude = leg.startLocation.longitude + (leg.endLocation.longitude - leg.startLocation.longitude) * progress;
                const latitude = leg.startLocation.latitude + (leg.endLocation.latitude - leg.startLocation.latitude) * progress;

                const stepDuration = (step.duration || 60) * 1000;
                currentTime += stepDuration / (validatedArgs.speedMultiplier || 10.0);

                positionSamples.push({
                  time: new Date(currentTime).toISOString(),
                  longitude,
                  latitude,
                  height: 0
                });
              }
            } else if (leg.endLocation) {
              // No steps - just add leg end location
              const legDuration = (leg.duration || 60) * 1000;
              currentTime += legDuration / (validatedArgs.speedMultiplier || 10.0);
              positionSamples.push({
                time: new Date(currentTime).toISOString(),
                longitude: leg.endLocation.longitude,
                latitude: leg.endLocation.latitude,
                height: leg.endLocation.height || 0
              });
            }
          }
        } else if (route.startLocation && route.endLocation) {
          // Simple start/end format
          positionSamples.push({
            time: new Date(currentTime).toISOString(),
            longitude: route.startLocation.longitude,
            latitude: route.startLocation.latitude,
            height: route.startLocation.height || 0
          });

          // Add waypoints if provided
          if (route.waypoints && Array.isArray(route.waypoints)) {
            const segmentDuration = (route.duration || 60) * 1000 / (route.waypoints.length + 1);
            for (const waypoint of route.waypoints) {
              currentTime += segmentDuration / (validatedArgs.speedMultiplier || 10.0);
              positionSamples.push({
                time: new Date(currentTime).toISOString(),
                longitude: waypoint.longitude,
                latitude: waypoint.latitude,
                height: waypoint.height || 0
              });
            }
          }

          // Add end location
          const finalDuration = (route.duration || 60) * 1000 / (route.waypoints ? route.waypoints.length + 1 : 1);
          currentTime += finalDuration / (validatedArgs.speedMultiplier || 10.0);
          positionSamples.push({
            time: new Date(currentTime).toISOString(),
            longitude: route.endLocation.longitude,
            latitude: route.endLocation.latitude,
            height: route.endLocation.height || 0
          });
        } else {
          throw new Error('Invalid route format: must provide either polyline (string/array), positions array, legs array, or startLocation/endLocation');
        }

        if (positionSamples.length < 2) {
          throw new Error(`Insufficient position samples: got ${positionSamples.length}, need at least 2`);
        }

        console.error(`Extracted ${positionSamples.length} position samples from route`);

        const animStartTime = positionSamples[0].time;
        const animStopTime = positionSamples[positionSamples.length - 1].time;

        // Store animation state
        const animState: AnimationState = {
          id: animationId,
          entityId,
          startTime: animStartTime,
          stopTime: animStopTime,
          currentSpeed: validatedArgs.speedMultiplier || 10.0,
          isPlaying: (args as any).autoPlay !== false,
          loopMode: 'none',
          createdAt: new Date()
        };
        animations.set(animationId, animState);

        // Also store by name if provided for easy lookup
        if (validatedArgs.name) {
          animations.set(validatedArgs.name, animState);
        }

        // Track camera if requested
        if ((args as any).trackCamera) {
          trackedEntityId = entityId;
        }

        // Send SSE command
        const sseCommand = {
          type: 'animation_create_from_route',
          animationId,
          entityId,
          positionSamples,
          startTime: animStartTime,
          stopTime: animStopTime,
          modelPreset,
          showPath: validatedArgs.showPath !== false,
          speedMultiplier: validatedArgs.speedMultiplier || 10.0,
          autoPlay: (args as any).autoPlay !== false,
          trackCamera: (args as any).trackCamera || false
        };

        await communicationServer.executeCommand(sseCommand);

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId,
          entityId,
          startTime: animStartTime,
          stopTime: animStopTime,
          modelPreset,
          message: `Animation created from route with ${positionSamples.length} position samples (${modelPreset} model)`,
          stats: {
            totalAnimations: animations.size,
            responseTime
          }
        };

        return {
          content: [{
            type: 'text',
            text: `✅ ${output.message}\n📝 Animation ID: ${animationId}\n🎯 Entity ID: ${entityId} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create animation: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 2: Create custom animation path
  server.registerTool(
    'animation_create_custom_path',
    {
      title: 'Create Custom Animation Path',
      description: 'Create a custom animated entity with manually specified position samples. Useful for creating complex animations, circular paths, or figure-eight patterns.',
      inputSchema: AnimationConfigSchema.extend({
        autoPlay: z.boolean().optional().describe('Automatically start animation after creation')
      }).shape,
      outputSchema: AnimationCreateResponseSchema.shape
    },
    async (args) => {
      const startTime = Date.now();

      try {
        const validatedArgs = AnimationConfigSchema.parse(args);

        const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const entityId = `animated_entity_${animationId}`;

        const animStartTime = validatedArgs.startTime || validatedArgs.positionSamples[0].time;
        const animStopTime = validatedArgs.stopTime || validatedArgs.positionSamples[validatedArgs.positionSamples.length - 1].time;

        const animState: AnimationState = {
          id: animationId,
          entityId,
          startTime: animStartTime,
          stopTime: animStopTime,
          currentSpeed: 1.0,
          isPlaying: (args as any).autoPlay !== false,
          loopMode: validatedArgs.loopMode || 'none',
          createdAt: new Date()
        };
        animations.set(animationId, animState);

        // Send SSE command
        const sseCommand = {
          type: 'animation_create_custom_path',
          animationId,
          entityId,
          positionSamples: validatedArgs.positionSamples,
          startTime: animStartTime,
          stopTime: animStopTime,
          interpolationAlgorithm: validatedArgs.interpolationAlgorithm || 'LAGRANGE',
          modelPreset: validatedArgs.model?.preset || 'cesium_man',
          modelUri: validatedArgs.model?.uri,
          modelScale: validatedArgs.model?.scale,
          showPath: validatedArgs.showPath !== false,
          loopMode: validatedArgs.loopMode || 'none',
          clampToGround: validatedArgs.clampToGround || false,
          autoPlay: (args as any).autoPlay !== false
        };

        await communicationServer.executeCommand(sseCommand);

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId,
          entityId,
          startTime: animStartTime,
          stopTime: animStopTime,
          modelPreset: validatedArgs.model?.preset || 'cesium_man',
          message: `Custom animation created with ${validatedArgs.positionSamples.length} position samples`,
          stats: {
            totalAnimations: animations.size,
            responseTime
          }
        };

        return {
          content: [{
            type: 'text',
            text: `✅ ${output.message}\n📝 Animation ID: ${animationId}\n🎯 Entity ID: ${entityId} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create custom animation: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 3: Play animation
  server.registerTool(
    'animation_play',
    {
      title: 'Play Animation',
      description: 'Start or resume animation playback using the shared Cesium clock',
      inputSchema: {
        animationId: z.string().describe('Animation ID')
      },
      outputSchema: AnimationStateResponseSchema.shape
    },
    async ({ animationId }) => {
      const startTime = Date.now();

      try {
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        animState.isPlaying = true;

        await communicationServer.executeCommand({
          type: 'animation_play',
          animationId
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId,
          entityId: animState.entityId,
          isAnimating: true,
          currentSpeed: animState.currentSpeed,
          message: 'Animation playback started',
          stats: { responseTime }
        };

        return {
          content: [{
            type: 'text',
            text: `▶️ ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to play animation: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 4: Pause animation
  server.registerTool(
    'animation_pause',
    {
      title: 'Pause Animation',
      description: 'Pause animation playback',
      inputSchema: {
        animationId: z.string().describe('Animation ID')
      },
      outputSchema: AnimationStateResponseSchema.shape
    },
    async ({ animationId }) => {
      const startTime = Date.now();

      try {
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        animState.isPlaying = false;

        await communicationServer.executeCommand({
          type: 'animation_pause',
          animationId
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId,
          entityId: animState.entityId,
          isAnimating: false,
          currentSpeed: animState.currentSpeed,
          message: 'Animation paused',
          stats: { responseTime }
        };

        return {
          content: [{
            type: 'text',
            text: `⏸️ ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to pause animation: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );


  // Tool 5: Update animation speed
  server.registerTool(
    'animation_update_speed',
    {
      title: 'Update Animation Speed',
      description: 'Change the playback speed multiplier of the animation clock',
      inputSchema: {
        animationId: z.string().describe('Animation ID'),
        multiplier: z.number().describe('Speed multiplier (e.g., 2.0 for 2x speed)')
      },
      outputSchema: AnimationStateResponseSchema.shape
    },
    async ({ animationId, multiplier }) => {
      const startTime = Date.now();

      try {
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        animState.currentSpeed = multiplier || 1.0;

        await communicationServer.executeCommand({
          type: 'animation_update_speed',
          animationId,
          multiplier
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId,
          entityId: animState.entityId,
          isAnimating: animState.isPlaying,
          currentSpeed: multiplier,
          message: `Speed updated to ${multiplier}x`,
          stats: { responseTime }
        };

        return {
          content: [{
            type: 'text',
            text: `⚡ ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to update speed: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 6: Remove animation
  server.registerTool(
    'animation_remove',
    {
      title: 'Remove Animation',
      description: 'Remove an animation and its associated entity',
      inputSchema: {
        animationId: z.string().describe('Animation ID to remove')
      },
      outputSchema: {
        success: z.boolean(),
        animationId: z.string(),
        message: z.string(),
        stats: z.object({
          remainingAnimations: z.number(),
          responseTime: z.number()
        })
      }
    },
    async ({ animationId }) => {
      const startTime = Date.now();

      try {
        const animState = animations.get(animationId);
        if (!animState) {
          throw new Error(`Animation ${animationId} not found`);
        }

        animations.delete(animationId);

        if (trackedEntityId === animState.entityId) {
          trackedEntityId = null;
        }

        await communicationServer.executeCommand({
          type: 'animation_remove',
          animationId,
          entityId: animState.entityId
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId,
          message: 'Animation removed',
          stats: {
            remainingAnimations: animations.size,
            responseTime
          }
        };

        return {
          content: [{
            type: 'text',
            text: `🗑️ ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to remove animation: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 7: List active animations
  server.registerTool(
    'animation_list_active',
    {
      title: 'List Active Animations',
      description: 'Get a list of all active animations with their current states',
      inputSchema: {},
      outputSchema: AnimationListResponseSchema.shape
    },
    async () => {
      const startTime = Date.now();

      try {
        const currentTime = new Date().toISOString();
        const animationsList = Array.from(animations.values()).map(anim => {
          const startMs = new Date(anim.startTime).getTime();
          const stopMs = new Date(anim.stopTime).getTime();
          const currentMs = new Date(currentTime).getTime();
          const totalDuration = stopMs - startMs;
          const elapsed = Math.max(0, currentMs - startMs);
          const remaining = Math.max(0, stopMs - currentMs);
          const progress = totalDuration > 0 ? Math.min(1, Math.max(0, elapsed / totalDuration)) : 0;

          return {
            entityId: anim.entityId,
            name: undefined,
            isAnimating: anim.isPlaying,
            currentTime: currentTime,
            startTime: anim.startTime,
            stopTime: anim.stopTime,
            progress: progress,
            elapsedSeconds: elapsed / 1000,
            remainingSeconds: remaining / 1000,
            clockMultiplier: anim.currentSpeed,
            loopMode: anim.loopMode,
            hasModel: true,
            hasPath: true
          };
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          message: `Found ${animationsList.length} active animation(s)`,
          animations: animationsList,
          clockState: {
            startTime: currentTime,
            stopTime: currentTime,
            currentTime: currentTime,
            multiplier: 1.0,
            shouldAnimate: true,
            clockRange: 'LOOP_STOP' as const
          },
          stats: {
            totalAnimations: animationsList.length,
            activeAnimations: animationsList.filter(a => a.isAnimating).length,
            responseTime
          }
        };

        // Build detailed text output with animation IDs
        const animDetails = Array.from(animations.entries()).map(([id, anim]) => {
          const state = animationsList.find(a => a.entityId === anim.entityId);
          return `\n  • ${id}${anim.id !== id ? ` (${anim.id})` : ''}\n` +
                 `    Entity: ${anim.entityId}\n` +
                 `    Status: ${anim.isPlaying ? '▶️ Playing' : '⏸️ Paused'}\n` +
                 `    Speed: ${anim.currentSpeed}x\n` +
                 `    Progress: ${state ? Math.round(state.progress * 100) : 0}%`;
        }).join('\n');

        return {
          content: [{
            type: 'text',
            text: `📋 ${output.message} (${responseTime}ms)${animDetails}`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to list animations: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 8: Configure path visualization
  server.registerTool(
    'animation_configure_path',
    {
      title: 'Configure Path Visualization',
      description: 'Update the visual appearance of an animation path trail',
      inputSchema: PathUpdateConfigSchema.shape,
      outputSchema: {
        success: z.boolean(),
        animationId: z.string(),
        message: z.string(),
        stats: z.object({
          responseTime: z.number()
        })
      }
    },
    async (args) => {
      const startTime = Date.now();

      try {
        const validatedArgs = PathUpdateConfigSchema.parse(args);
        const animState = animations.get(validatedArgs.animationId);

        if (!animState) {
          throw new Error(`Animation ${validatedArgs.animationId} not found`);
        }

        await communicationServer.executeCommand({
          type: 'animation_configure_path',
          animationId: validatedArgs.animationId,
          entityId: animState.entityId,
          leadTime: validatedArgs.leadTime,
          trailTime: validatedArgs.trailTime,
          width: validatedArgs.width,
          color: validatedArgs.color
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId: validatedArgs.animationId,
          message: 'Path visualization updated',
          stats: { responseTime }
        };

        return {
          content: [{
            type: 'text',
            text: `🎨 ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to configure path: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 9: Track entity with camera
  server.registerTool(
    'animation_track_entity',
    {
      title: 'Track Entity with Camera',
      description: 'Make the camera follow an animated entity for an immersive viewing experience',
      inputSchema: CameraTrackingConfigSchema.shape,
      outputSchema: CameraTrackingResponseSchema.shape
    },
    async (args) => {
      const startTime = Date.now();

      try {
        const validatedArgs = CameraTrackingConfigSchema.parse(args);
        const animState = animations.get(validatedArgs.animationId);

        if (!animState) {
          throw new Error(`Animation ${validatedArgs.animationId} not found`);
        }

        trackedEntityId = animState.entityId;

        await communicationServer.executeCommand({
          type: 'animation_track_entity',
          animationId: validatedArgs.animationId,
          entityId: animState.entityId,
          range: validatedArgs.range,
          pitch: validatedArgs.pitch,
          heading: validatedArgs.heading
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          animationId: validatedArgs.animationId,
          entityId: animState.entityId,
          isTracking: true,
          trackingConfig: {
            range: validatedArgs.range,
            pitch: validatedArgs.pitch,
            heading: validatedArgs.heading
          },
          message: 'Camera now tracking entity',
          stats: { responseTime }
        };

        return {
          content: [{
            type: 'text',
            text: `📹 ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to track entity: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 10: Untrack camera
  server.registerTool(
    'animation_untrack_camera',
    {
      title: 'Untrack Camera',
      description: 'Stop camera tracking and return control to user',
      inputSchema: {},
      outputSchema: CameraTrackingResponseSchema.shape
    },
    async () => {
      const startTime = Date.now();

      try {
        trackedEntityId = null;

        await communicationServer.executeCommand({
          type: 'animation_untrack_camera'
        });

        const responseTime = Date.now() - startTime;
        const output = {
          success: true,
          isTracking: false,
          message: 'Camera tracking disabled',
          stats: { responseTime }
        };

        return {
          content: [{
            type: 'text',
            text: `🎥 ${output.message} (${responseTime}ms)`
          }],
          structuredContent: output
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          content: [{
            type: 'text',
            text: `❌ Failed to untrack camera: ${errorMessage} (${responseTime}ms)`
          }],
          isError: true
        };
      }
    }
  );

  console.error(`✅ Registered 10 animation tools`);
}
