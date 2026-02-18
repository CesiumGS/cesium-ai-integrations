import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ICommunicationServer } from '@cesium-mcp/shared';
import {
  JulianDateSchema,
  ClockSchema,
  ClockResponseSchema
} from '@cesium-mcp/entity-server/schemas';

export function registerClockTools(server: McpServer, communicationServer: ICommunicationServer | undefined): void {
  if (!communicationServer) {
    throw new Error('Clock tools require a communication server for browser visualization');
  }

  // Tool: Configure Clock
  server.registerTool(
    'clock_configure',
    {
      title: 'Configure Animation Clock',
      description: 'Set up the global animation clock with start time, stop time, and animation settings',
      inputSchema: {
        clock: ClockSchema
      },
      outputSchema: ClockResponseSchema.shape
    },
    async ({ clock }) => {
      const startTime = Date.now();

      try {
        const command = {
          type: 'clock_configure',
          clock
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Clock configured from ${clock.startTime.dayNumber}:${clock.startTime.secondsOfDay} to ${clock.stopTime.dayNumber}:${clock.stopTime.secondsOfDay}`,
            clockState: clock,
            stats: {
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `🕐 ${output.message} (${responseTime}ms)`
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
          message: `Failed to configure clock: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stats: {
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

  // Tool: Set Clock Time
  server.registerTool(
    'clock_set_time',
    {
      title: 'Set Clock Time',
      description: 'Set the current time of the animation clock',
      inputSchema: {
        currentTime: JulianDateSchema
      },
      outputSchema: ClockResponseSchema.shape
    },
    async ({ currentTime }) => {
      const startTime = Date.now();

      try {
        const command = {
          type: 'clock_set_time',
          currentTime
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Clock time set to ${currentTime.dayNumber}:${currentTime.secondsOfDay}`,
            stats: {
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `🕐 ${output.message} (${responseTime}ms)`
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
          message: `Failed to set clock time: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stats: {
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

  // Tool: Timeline Zoom
  server.registerTool(
    'timeline_zoom_to_range',
    {
      title: 'Zoom Timeline to Range',
      description: 'Zoom the timeline to display a specific time range',
      inputSchema: {
        startTime: JulianDateSchema,
        stopTime: JulianDateSchema
      },
      outputSchema: ClockResponseSchema.shape
    },
    async ({ startTime, stopTime }) => {
      const startTimeMs = Date.now();

      try {
        const command = {
          type: 'timeline_zoom',
          startTime,
          stopTime
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTimeMs;

        if (result.success) {
          const output = {
            success: true,
            message: `Timeline zoomed to range ${startTime.dayNumber}:${startTime.secondsOfDay} - ${stopTime.dayNumber}:${stopTime.secondsOfDay}`,
            stats: {
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `🔍 ${output.message} (${responseTime}ms)`
              }
            ],
            structuredContent: output
          };
        } else {
          throw new Error(result.error || 'Unknown error from Cesium');
        }
      } catch (error) {
        const responseTime = Date.now() - startTimeMs;
        const errorOutput = {
          success: false,
          message: `Failed to zoom timeline: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stats: {
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

  // Tool: Globe Lighting Control
  server.registerTool(
    'globe_set_lighting',
    {
      title: 'Control Globe Lighting',
      description: 'Enable or disable realistic globe lighting effects for day/night cycles',
      inputSchema: {
        enableLighting: z.boolean().describe('Enable realistic lighting effects'),
        enableDynamicAtmosphere: z.boolean().optional().default(true).describe('Enable dynamic atmosphere lighting'),
        enableSunLighting: z.boolean().optional().default(true).describe('Enable lighting from sun position')
      },
      outputSchema: ClockResponseSchema.shape
    },
    async ({ enableLighting, enableDynamicAtmosphere, enableSunLighting }) => {
      const startTime = Date.now();

      try {
        const command = {
          type: 'globe_lighting',
          enableLighting,
          enableDynamicAtmosphere,
          enableSunLighting
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Globe lighting ${enableLighting ? 'enabled' : 'disabled'} with dynamic atmosphere: ${enableDynamicAtmosphere}, sun lighting: ${enableSunLighting}`,
            stats: {
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `🌍 ${output.message} (${responseTime}ms)`
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
          message: `Failed to set globe lighting: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stats: {
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

  // Tool: Clock Multiplier Control
  server.registerTool(
    'clock_set_multiplier',
    {
      title: 'Set Clock Multiplier',
      description: 'Change the time rate multiplier for speeding up or slowing down time',
      inputSchema: {
        multiplier: z.number().describe('Time rate multiplier (e.g., 1000 for 1000x real time)')
      },
      outputSchema: ClockResponseSchema.shape
    },
    async ({ multiplier }) => {
      const startTime = Date.now();

      try {
        const command = {
          type: 'clock_multiplier',
          multiplier
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Clock multiplier set to ${multiplier}x real time`,
            stats: {
              responseTime
            }
          };

          return {
            content: [
              {
                type: 'text',
                text: `⏱️ ${output.message} (${responseTime}ms)`
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
          message: `Failed to set clock multiplier: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stats: {
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
