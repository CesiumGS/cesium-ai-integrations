import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ICommunicationServer,
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import {
  RouteAnimationConfigSchema,
  AnimationCreateResponseSchema,
} from "../schemas/index.js";
import {
  TRAVEL_MODE_TO_MODEL,
  parseDuration,
  decimateArray,
} from "../utils/index.js";
import { animations, setTrackedEntityId, AnimationState } from "../utils/shared-state.js";
import {
  LONG_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_create_from_route tool
 */
export function registerAnimationCreateFromRoute(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
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
            // Encoded polyline string - would need decoding (not implemented yet)
            throw new Error('Encoded polyline strings not yet supported. Please provide decoded coordinates array.');
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
          setTrackedEntityId(entityId);
        }
        
        // Send command through communication server
        const command = {
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
        
        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          LONG_TIMEOUT_MS,
        );
        
        if (result.success) {
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
          
          return buildSuccessResponse(
            ResponseEmoji.Animation,
            responseTime,
            output,
          );
        }
        
        throw new Error(result.error || 'Unknown error from client');
      } catch (error) {
        return buildErrorResponse(
          0,
          {
            success: false,
            message: `Failed to create animation: ${formatErrorMessage(error)}`,
            stats: { responseTime: 0 },
          } as any,
        );
      }
    }
  );
}
