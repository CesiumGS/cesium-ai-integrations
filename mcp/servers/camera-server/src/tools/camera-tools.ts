import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ICommunicationServer } from '@cesium-mcp/shared';
import { 
  CesiumPositionSchema, 
  CesiumOrientationSchema,
  EasingFunctionSchema,
  HeadingPitchRangeSchema,
} from '../schemas.js';

export function registerCameraTools(server: McpServer, communicationServer: ICommunicationServer | undefined): void {
  if (!communicationServer) {
    throw new Error('Camera tools require a communication server for browser visualization');
  }

  // Enhanced Tool: Fly camera to specific position with advanced options
  server.registerTool(
    'camera_fly_to',
    {
      title: 'Fly Camera To Position',
      description: 'Execute camera fly operation with advanced options like easing functions and callbacks',
      inputSchema: {
        destination: CesiumPositionSchema,
        orientation: CesiumOrientationSchema.optional(),
        duration: z.number().min(0).optional().describe('Animation duration in seconds (default: 3)'),
        easingFunction: EasingFunctionSchema,
        maximumHeight: z.number().min(0).optional().describe('Maximum height during flight in meters'),
        pitchAdjustHeight: z.number().min(0).optional().describe('Height above ground to adjust pitch'),
        flyOverLongitude: z.number().optional().describe('Longitude to fly over during flight'),
        flyOverLongitudeWeight: z.number().min(0).max(1).optional().describe('Weight of flyOverLongitude (0-1)')
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        finalPosition: CesiumPositionSchema,
        finalOrientation: CesiumOrientationSchema,
        stats: z.object({
          clients: z.number(),
          responseTime: z.number(),
          actualDuration: z.number().optional()
        })
      }
    },
    async ({ destination, orientation, duration = 3, easingFunction, maximumHeight, pitchAdjustHeight, flyOverLongitude, flyOverLongitudeWeight }) => {
      const startTime = Date.now();
      
      try {
        const finalOrientation = orientation || {
          heading: 0,
          pitch: -15,
          roll: 0
        };

        // Enhanced command with advanced options
        const command = {
          type: 'camera_fly_to',
          destination,
          orientation: finalOrientation,
          duration,
          easingFunction,
          maximumHeight,
          pitchAdjustHeight,
          flyOverLongitude,
          flyOverLongitudeWeight
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;
        
        if (result.success) {
          const output = {
            success: true,
            message: `Camera flew to ${destination.latitude}°, ${destination.longitude}° at ${destination.height}m height${easingFunction ? ` with ${easingFunction} easing` : ''}`,
            finalPosition: destination,
            finalOrientation,
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime,
              actualDuration: result.actualDuration
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `✅ ${output.message} (${responseTime}ms, ${output.stats.clients} client(s))`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to execute camera fly: ${error instanceof Error ? error.message : 'Unknown error'}`,
          finalPosition: destination,
          finalOrientation: orientation || { heading: 0, pitch: -15, roll: 0 },
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorOutput.message} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );

  // Enhanced Tool: Set camera view instantly with orientation options
  server.registerTool(
    'camera_set_view',
    {
      title: 'Set Camera View',
      description: 'Instantly set camera position and orientation without animation',
      inputSchema: {
        destination: CesiumPositionSchema,
        orientation: CesiumOrientationSchema.optional()
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        position: CesiumPositionSchema,
        orientation: CesiumOrientationSchema,
        stats: z.object({
          clients: z.number(),
          responseTime: z.number()
        })
      }
    },
    async ({ destination, orientation }) => {
      const startTime = Date.now();
      
      try {
        const finalOrientation = orientation || {
          heading: 0,
          pitch: -15,
          roll: 0
        };

        const command = {
          type: 'camera_set_view',
          destination,
          orientation: finalOrientation
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Camera view set to ${destination.latitude}°, ${destination.longitude}° at ${destination.height}m height`,
            position: destination,
            orientation: finalOrientation,
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `✅ ${output.message} (${responseTime}ms)`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to set camera view: ${error instanceof Error ? error.message : 'Unknown error'}`,
          position: destination,
          orientation: orientation || { heading: 0, pitch: -15, roll: 0 },
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorOutput.message} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );

  // New Tool: Look at transform (lock camera to a point)
  server.registerTool(
    'camera_look_at_transform',
    {
      title: 'Look At Transform',
      description: 'Lock the camera to look at a specific point on Earth, useful for orbiting around landmarks',
      inputSchema: {
        target: CesiumPositionSchema.describe('Target position to look at'),
        offset: HeadingPitchRangeSchema.optional().describe('Camera offset from target (default: heading=0, pitch=-90°, range=1000m)')
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        target: CesiumPositionSchema,
        offset: HeadingPitchRangeSchema,
        stats: z.object({
          clients: z.number(),
          responseTime: z.number()
        })
      }
    },
    async ({ target, offset }) => {
      const startTime = Date.now();
      
      try {
        const finalOffset = offset || {
          heading: 0,
          pitch: -Math.PI / 2, // -90 degrees 
          range: 1000
        };

        const command = {
          type: 'camera_look_at_transform',
          target,
          offset: finalOffset
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Camera locked to look at ${target.latitude}°, ${target.longitude}° from ${finalOffset.range}m distance`,
            target,
            offset: finalOffset,
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `✅ ${output.message} (${responseTime}ms)`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to set look at transform: ${error instanceof Error ? error.message : 'Unknown error'}`,
          target,
          offset: offset || { heading: 0, pitch: -Math.PI / 2, range: 1000 },
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorOutput.message} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );

  // New Tool: Camera orbit control
  server.registerTool(
    'camera_start_orbit',
    {
      title: 'Start Camera Orbit',
      description: 'Start orbiting around the current look-at target',
      inputSchema: {
        speed: z.number().optional().describe('Orbit speed in radians per second (default: 0.005)'),
        direction: z.enum(['clockwise', 'counterclockwise']).optional().describe('Orbit direction (default: counterclockwise)')
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        orbitActive: z.boolean(),
        speed: z.number(),
        direction: z.string(),
        stats: z.object({
          clients: z.number(),
          responseTime: z.number()
        })
      }
    },
    async ({ speed = 0.005, direction = 'counterclockwise' }) => {
      const startTime = Date.now();
      
      try {
        const command = {
          type: 'camera_start_orbit',
          speed: direction === 'clockwise' ? -Math.abs(speed) : Math.abs(speed)
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Camera orbit started (${direction}, ${Math.abs(speed)} rad/s)`,
            orbitActive: true,
            speed,
            direction,
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `🔄 ${output.message} (${responseTime}ms)`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to start orbit: ${error instanceof Error ? error.message : 'Unknown error'}`,
          orbitActive: false,
          speed,
          direction,
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorOutput.message} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );

  // New Tool: Stop camera orbit
  server.registerTool(
    'camera_stop_orbit',
    {
      title: 'Stop Camera Orbit',
      description: 'Stop the current camera orbit animation',
      inputSchema: {},
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        orbitActive: z.boolean(),
        stats: z.object({
          clients: z.number(),
          responseTime: z.number()
        })
      }
    },
    async () => {
      const startTime = Date.now();
      
      try {
        const command = {
          type: 'camera_stop_orbit'
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: 'Camera orbit stopped',
            orbitActive: false,
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `⏹️ ${output.message} (${responseTime}ms)`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to stop orbit: ${error instanceof Error ? error.message : 'Unknown error'}`,
          orbitActive: false,
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorOutput.message} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );

  // Enhanced Tool: Get current camera position and additional info
  server.registerTool(
    'camera_get_position',
    {
      title: 'Get Camera Position',
      description: 'Get comprehensive camera information including position, orientation, and view bounds',
      inputSchema: {},
      outputSchema: {
        position: CesiumPositionSchema,
        orientation: CesiumOrientationSchema,
        viewRectangle: z.object({
          west: z.number(),
          south: z.number(), 
          east: z.number(),
          north: z.number()
        }).optional().describe('Visible geographic bounds'),
        altitude: z.number().describe('Camera altitude above sea level'),
        timestamp: z.string(),
        stats: z.object({
          clients: z.number(),
          responseTime: z.number()
        })
      }
    },
    async () => {
      const startTime = Date.now();
      
      try {
        const command = {
          type: 'camera_get_position'
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success && result.position && result.orientation) {
          const output = {
            position: result.position,
            orientation: result.orientation,
            viewRectangle: result.viewRectangle,
            altitude: result.altitude || result.position.height,
            timestamp: new Date().toISOString(),
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `📍 Camera at ${result.position.latitude.toFixed(4)}°, ${result.position.longitude.toFixed(4)}° (${Math.round(result.position.height)}m altitude) - ${responseTime}ms`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Failed to get camera position');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          position: { longitude: 0, latitude: 0, height: 0 },
          orientation: { heading: 0, pitch: 0, roll: 0 },
          altitude: 0,
          timestamp: new Date().toISOString(),
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get camera position: ${error instanceof Error ? error.message : 'Unknown error'} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );

  // New Tool: Camera screen space controller settings
  server.registerTool(
    'camera_set_controller_options',
    {
      title: 'Set Camera Controller Options',
      description: 'Configure camera movement constraints and behavior',
      inputSchema: {
        enableCollisionDetection: z.boolean().optional().describe('Allow camera to go underground (default: true)'),
        minimumZoomDistance: z.number().min(0).optional().describe('Minimum distance camera can zoom to surface'),
        maximumZoomDistance: z.number().min(0).optional().describe('Maximum distance camera can zoom from surface'),
        enableTilt: z.boolean().optional().describe('Allow camera tilting'),
        enableRotate: z.boolean().optional().describe('Allow camera rotation'),
        enableTranslate: z.boolean().optional().describe('Allow camera translation'),
        enableZoom: z.boolean().optional().describe('Allow camera zooming'),
        enableLook: z.boolean().optional().describe('Allow free look around')
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        settings: z.object({
          enableCollisionDetection: z.boolean(),
          minimumZoomDistance: z.number().optional(),
          maximumZoomDistance: z.number().optional(),
          enableTilt: z.boolean(),
          enableRotate: z.boolean(),
          enableTranslate: z.boolean(),
          enableZoom: z.boolean(),
          enableLook: z.boolean()
        }),
        stats: z.object({
          clients: z.number(),
          responseTime: z.number()
        })
      }
    },
    async ({ enableCollisionDetection, minimumZoomDistance, maximumZoomDistance, enableTilt, enableRotate, enableTranslate, enableZoom, enableLook }) => {
      const startTime = Date.now();
      
      try {
        const command = {
          type: 'camera_set_controller_options',
          options: {
            enableCollisionDetection,
            minimumZoomDistance,
            maximumZoomDistance,
            enableTilt,
            enableRotate,
            enableTranslate,
            enableZoom,
            enableLook
          }
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: 'Camera controller options updated',
            settings: result.settings || command.options,
            stats: {
              clients: communicationServer.getStats().clients,
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `⚙️ ${output.message} (${responseTime}ms)`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to set controller options: ${error instanceof Error ? error.message : 'Unknown error'}`,
          settings: {
            enableCollisionDetection: enableCollisionDetection ?? true,
            minimumZoomDistance,
            maximumZoomDistance,
            enableTilt: enableTilt ?? true,
            enableRotate: enableRotate ?? true,
            enableTranslate: enableTranslate ?? true,
            enableZoom: enableZoom ?? true,
            enableLook: enableLook ?? true
          },
          stats: {
            clients: communicationServer.getStats().clients,
            responseTime
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorOutput.message} (${responseTime}ms)`
            }
          ],
          structuredContent: errorOutput,
          isError: true
        };
      }
    }
  );
}

