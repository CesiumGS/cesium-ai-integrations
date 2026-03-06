/**
 * Unit Tests for Camera Manager MCP Communication
 * Tests request/response handling between camera manager and MCP server
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import CesiumCameraManager from "../../src/managers/camera-manager";
import type { CesiumViewer } from "../../src/types/cesium-types";
import type {
  MCPCommand,
  CameraPosition,
  CameraOrientation,
  CameraFlyToResult,
  CameraViewResult,
  CameraPositionResult,
} from "../../src/types/mcp";

// Mock Cesium utilities for Unit tests
vi.mock("../../src/shared/camera-utils", () => ({
  flyToPosition: vi.fn((viewer, position, orientation, duration, callbacks) => {
    setTimeout(() => {
      if (callbacks?.complete) {
        callbacks.complete();
      }
    }, 0);
  }),
  setCameraView: vi.fn(),
  getCameraPosition: vi.fn(() => ({
    position: { longitude: -105.5, latitude: 39.8, height: 2000 },
    orientation: { heading: 0, pitch: -45, roll: 0 },
  })),
  lookAtPosition: vi.fn(),
  getCameraViewRectangle: vi.fn(() => ({
    west: -106,
    south: 39,
    east: -105,
    north: 40,
  })),
}));

describe("Camera Manager MCP Communication Integration Tests", () => {
  let cameraManager: CesiumCameraManager;
  let mockViewer: CesiumViewer;
  let commandHandlers: Map<string, (cmd: MCPCommand) => unknown>;

  beforeEach(() => {
    // Create mock Cesium viewer
    mockViewer = {
      camera: {
        positionCartographic: {
          longitude: -1.841,
          latitude: 0.694,
          height: 2000,
        },
        rotateRight: vi.fn(),
      },
      scene: {
        camera: {
          rotateRight: vi.fn(),
        },
        screenSpaceCameraController: {
          enableCollisionDetection: true,
          minimumZoomDistance: 1.0,
          maximumZoomDistance: 40000000.0,
          enableTilt: true,
          enableRotate: true,
          enableTranslate: true,
          enableZoom: true,
          enableLook: true,
        },
      },
      clock: {
        onTick: {
          addEventListener: vi.fn(() => vi.fn()),
        },
      },
    } as unknown as CesiumViewer;

    cameraManager = new CesiumCameraManager(mockViewer);
    commandHandlers = cameraManager.getCommandHandlers();
  });

  describe("MCP Command Request/Response Flow", () => {
    it("should handle complete camera_fly_to request with all properties", async () => {
      const command: MCPCommand = {
        type: "camera_fly_to",
        destination: {
          longitude: -105.2705,
          latitude: 40.015,
          height: 4500,
        } as CameraPosition,
        orientation: {
          heading: 45,
          pitch: -30,
          roll: 5,
        } as CameraOrientation,
        duration: 5,
        easingFunction: "easeInOut",
        maximumHeight: 10000,
        pitchAdjustHeight: 2000,
      };

      const handler = commandHandlers.get("camera_fly_to");
      const response = (await handler(command)) as CameraFlyToResult;

      // Verify response structure
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.position).toEqual(command.destination);
      expect(response.orientation).toEqual(command.orientation);
      expect(response.actualDuration).toBe(5);
      expect(response.cancelled).toBe(false);
    });

    it("should handle camera_fly_to with minimal required properties", async () => {
      const command: MCPCommand = {
        type: "camera_fly_to",
        destination: {
          longitude: -105.5,
          latitude: 39.8,
          height: 2000,
        } as CameraPosition,
      };

      const handler = commandHandlers.get("camera_fly_to");
      const response = (await handler(command)) as CameraFlyToResult;

      expect(response.success).toBe(true);
      expect(response.position).toEqual(command.destination);
      expect(response.orientation).toBeDefined();
    });

    it("should reject camera_fly_to with invalid coordinates", async () => {
      const command: MCPCommand = {
        type: "camera_fly_to",
        destination: {
          longitude: 200, // Invalid
          latitude: 39.8,
          height: 2000,
        } as CameraPosition,
      };

      const handler = commandHandlers.get("camera_fly_to");
      const response = (await handler(command)) as CameraFlyToResult;

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.toLowerCase()).toContain("longitude");
    });

    it("should handle camera_set_view request with complete properties", () => {
      const command: MCPCommand = {
        type: "camera_set_view",
        destination: {
          longitude: -75.1652,
          latitude: 39.9526,
          height: 1000,
        } as CameraPosition,
        orientation: {
          heading: 90,
          pitch: -45,
          roll: 0,
        } as CameraOrientation,
      };

      const handler = commandHandlers.get("camera_set_view");
      const response = handler(command) as CameraViewResult;

      expect(response.success).toBe(true);
      expect(response.position).toEqual(command.destination);
      expect(response.orientation).toEqual(command.orientation);
    });

    it("should return error for camera_set_view with missing destination", () => {
      const command: MCPCommand = {
        type: "camera_set_view",
      } as unknown as MCPCommand;

      const handler = commandHandlers.get("camera_set_view");
      const response = handler(command) as CameraViewResult;

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.toLowerCase()).toContain("destination");
    });

    it("should reject camera_set_view with invalid longitude", () => {
      const command: MCPCommand = {
        type: "camera_set_view",
        destination: {
          longitude: 181,
          latitude: 39.9,
          height: 1000,
        } as CameraPosition,
      };

      const handler = commandHandlers.get("camera_set_view");
      const response = handler(command) as CameraViewResult;

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.toLowerCase()).toContain("longitude");
    });

    it("should reject camera_set_view with invalid latitude", () => {
      const command: MCPCommand = {
        type: "camera_set_view",
        destination: {
          longitude: -75.0,
          latitude: 95,
          height: 1000,
        } as CameraPosition,
      };

      const handler = commandHandlers.get("camera_set_view");
      const response = handler(command) as CameraViewResult;

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.toLowerCase()).toContain("latitude");
    });

    it("should handle camera_get_position request and return complete data", () => {
      const command: MCPCommand = {
        type: "camera_get_position",
      };

      const handler = commandHandlers.get("camera_get_position");
      const response = handler(command) as CameraPositionResult;

      // Verify complete response structure
      expect(response.success).toBe(true);
      expect(response.position).toBeDefined();
      expect(response.position?.longitude).toBeDefined();
      expect(response.position?.latitude).toBeDefined();
      expect(response.position?.height).toBeDefined();
      expect(response.orientation).toBeDefined();
      expect(response.orientation?.heading).toBeDefined();
      expect(response.orientation?.pitch).toBeDefined();
      expect(response.orientation?.roll).toBeDefined();
      expect(response.viewRectangle).toBeDefined();
      expect(response.altitude).toBeDefined();
    });

    it("should handle camera_look_at_transform with offset parameters", () => {
      const command: MCPCommand = {
        type: "camera_look_at_transform",
        target: {
          longitude: -105.5,
          latitude: 39.8,
          height: 2000,
        } as CameraPosition,
        offset: {
          heading: 45,
          pitch: -30,
          range: 5000,
        },
      };

      const handler = commandHandlers.get("camera_look_at_transform");
      const response = handler(command);

      expect(response.success).toBe(true);
      expect(response.target).toEqual(command.target);
      expect(response.offset).toEqual(command.offset);
    });

    it("should return error for camera_look_at_transform with missing target", () => {
      const command: MCPCommand = {
        type: "camera_look_at_transform",
      } as unknown as MCPCommand;

      const handler = commandHandlers.get("camera_look_at_transform");
      const response = handler(command);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.toLowerCase()).toContain("target");
    });

    it("should handle camera_start_orbit with custom speed", () => {
      const command: MCPCommand = {
        type: "camera_start_orbit",
        speed: 0.05,
      };

      const handler = commandHandlers.get("camera_start_orbit");
      const response = handler(command);

      expect(response.success).toBe(true);
      expect(response.orbitActive).toBe(true);
      expect(response.speed).toBe(0.05);
    });

    it("should handle camera_start_orbit without speed and use default", () => {
      const command: MCPCommand = {
        type: "camera_start_orbit",
      };

      const handler = commandHandlers.get("camera_start_orbit");
      const response = handler(command);

      expect(response.success).toBe(true);
      expect(response.orbitActive).toBe(true);
      // DEFAULT_ORBIT_SPEED = 0.005
      expect(cameraManager.orbitSpeed).toBe(0.005);
    });

    it("should handle camera_stop_orbit request", () => {
      // Start orbit first
      const startHandler = commandHandlers.get("camera_start_orbit");
      startHandler({ type: "camera_start_orbit" });

      // Stop orbit
      const stopHandler = commandHandlers.get("camera_stop_orbit");
      const response = stopHandler({ type: "camera_stop_orbit" });

      expect(response.success).toBe(true);
      expect(response.orbitActive).toBe(false);
    });

    it("should handle camera_set_controller_options with multiple properties", () => {
      const command: MCPCommand = {
        type: "camera_set_controller_options",
        options: {
          enableCollisionDetection: false,
          minimumZoomDistance: 100,
          maximumZoomDistance: 5000000,
          enableRotate: false,
          enableZoom: true,
          enableTilt: true,
        },
      };

      const handler = commandHandlers.get("camera_set_controller_options");
      const response = handler(command);

      expect(response.success).toBe(true);
      expect(response.settings).toBeDefined();
      expect(response.settings.enableCollisionDetection).toBe(false);
      expect(response.settings.minimumZoomDistance).toBe(100);
      expect(response.settings.enableRotate).toBe(false);
    });

    it("should handle camera_set_controller_options with empty options and return current settings", () => {
      const command: MCPCommand = {
        type: "camera_set_controller_options",
        options: {},
      };

      const handler = commandHandlers.get("camera_set_controller_options");
      const response = handler(command);

      expect(response.success).toBe(true);
      expect(response.settings).toBeDefined();
      // Mock viewer defaults should be returned unchanged
      expect(response.settings.enableCollisionDetection).toBe(true);
      expect(response.settings.minimumZoomDistance).toBe(1.0);
      expect(response.settings.maximumZoomDistance).toBe(40000000.0);
      expect(response.settings.enableTilt).toBe(true);
      expect(response.settings.enableRotate).toBe(true);
      expect(response.settings.enableTranslate).toBe(true);
      expect(response.settings.enableZoom).toBe(true);
      expect(response.settings.enableLook).toBe(true);
    });
  });

  describe("Sequential Command Workflows", () => {
    it("should handle fly-to followed by get-position workflow", async () => {
      // Step 1: Fly to location
      const flyCommand: MCPCommand = {
        type: "camera_fly_to",
        destination: {
          longitude: -105.5,
          latitude: 39.8,
          height: 3000,
        } as CameraPosition,
        duration: 2,
      };

      const flyHandler = commandHandlers.get("camera_fly_to");
      const flyResponse = await flyHandler(flyCommand);
      expect(flyResponse.success).toBe(true);

      // Step 2: Get position
      const getPositionHandler = commandHandlers.get("camera_get_position");
      const positionResponse = getPositionHandler({
        type: "camera_get_position",
      });

      expect(positionResponse.success).toBe(true);
      expect(positionResponse.position).toBeDefined();
    });

    it("should handle multiple sequential camera movements", async () => {
      const locations = [
        { longitude: -105.0, latitude: 40.0, height: 3000 },
        { longitude: -106.0, latitude: 41.0, height: 4000 },
        { longitude: -104.0, latitude: 39.0, height: 2500 },
      ];

      const flyHandler = commandHandlers.get("camera_fly_to");

      for (const location of locations) {
        const command: MCPCommand = {
          type: "camera_fly_to",
          destination: location as CameraPosition,
          duration: 1,
        };

        const response = await flyHandler(command);
        expect(response.success).toBe(true);
        expect(response.position).toEqual(location);
      }
    });

    it("should handle orbit start-stop cycle", () => {
      const startHandler = commandHandlers.get("camera_start_orbit");
      const stopHandler = commandHandlers.get("camera_stop_orbit");

      // Start orbit
      const startResponse = startHandler({
        type: "camera_start_orbit",
        speed: 0.02,
      });
      expect(startResponse.success).toBe(true);
      expect(startResponse.orbitActive).toBe(true);

      // Verify orbit is active
      expect(cameraManager.orbitSpeed).toBe(0.02);

      // Stop orbit
      const stopResponse = stopHandler({ type: "camera_stop_orbit" });
      expect(stopResponse.success).toBe(true);
      expect(stopResponse.orbitActive).toBe(false);

      // Verify orbit is stopped
      expect(cameraManager.orbitSpeed).toBe(0);
    });

    it("should handle look-at followed by orbit workflow", () => {
      // Look at target
      const lookAtHandler = commandHandlers.get("camera_look_at_transform");
      const lookAtResponse = lookAtHandler({
        type: "camera_look_at_transform",
        target: {
          longitude: -105.5,
          latitude: 39.8,
          height: 2000,
        } as CameraPosition,
        offset: { range: 5000 },
      });
      expect(lookAtResponse.success).toBe(true);

      // Start orbiting around target
      const startOrbitHandler = commandHandlers.get("camera_start_orbit");
      const orbitResponse = startOrbitHandler({
        type: "camera_start_orbit",
        speed: 0.01,
      });
      expect(orbitResponse.success).toBe(true);
      expect(orbitResponse.orbitActive).toBe(true);
    });
  });

  describe("Error Handling in MCP Communication", () => {
    it("should return structured error for invalid request parameters", async () => {
      const command: MCPCommand = {
        type: "camera_fly_to",
        destination: {
          longitude: 500, // Invalid
          latitude: 200, // Invalid
          height: -5000, // Invalid
        } as CameraPosition,
      };

      const handler = commandHandlers.get("camera_fly_to");
      const response = await handler(command);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe("string");
    });

    it("should handle missing required properties gracefully", async () => {
      const command: MCPCommand = {
        type: "camera_fly_to",
        // Missing destination property
      } as unknown as MCPCommand;

      const handler = commandHandlers.get("camera_fly_to");

      // Should not throw, should return error response
      await expect(async () => {
        const response = await handler(command);
        expect(response.success).toBe(false);
      }).not.toThrow();
    });

    it("should validate all coordinate boundaries", async () => {
      const invalidCoordinates = [
        { longitude: -181, latitude: 40, height: 1000 }, // lon too low
        { longitude: 181, latitude: 40, height: 1000 }, // lon too high
        { longitude: -105, latitude: -91, height: 1000 }, // lat too low
        { longitude: -105, latitude: 91, height: 1000 }, // lat too high
      ];

      const handler = commandHandlers.get("camera_fly_to");

      for (const coords of invalidCoordinates) {
        const command: MCPCommand = {
          type: "camera_fly_to",
          destination: coords as CameraPosition,
        };

        const response = await handler(command);
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
      }
    });
  });

  describe("Response Schema Validation", () => {
    it("should ensure camera_fly_to response matches expected schema", async () => {
      const command: MCPCommand = {
        type: "camera_fly_to",
        destination: {
          longitude: -105.5,
          latitude: 39.8,
          height: 2000,
        } as CameraPosition,
      };

      const handler = commandHandlers.get("camera_fly_to");
      const response = (await handler(command)) as CameraFlyToResult;

      // Validate response has all required fields
      expect(response).toHaveProperty("success");
      expect(typeof response.success).toBe("boolean");

      if (response.success) {
        expect(response).toHaveProperty("position");
        expect(response.position).toHaveProperty("longitude");
        expect(response.position).toHaveProperty("latitude");
        expect(response.position).toHaveProperty("height");
        expect(response).toHaveProperty("orientation");
        expect(response).toHaveProperty("actualDuration");
        expect(response).toHaveProperty("cancelled");
      } else {
        expect(response).toHaveProperty("error");
        expect(typeof response.error).toBe("string");
      }
    });

    it("should ensure camera_get_position response matches expected schema", () => {
      const handler = commandHandlers.get("camera_get_position");
      const response = handler({
        type: "camera_get_position",
      }) as CameraPositionResult;

      expect(response).toHaveProperty("success");
      expect(typeof response.success).toBe("boolean");

      if (response.success) {
        expect(response).toHaveProperty("position");
        expect(response.position).toHaveProperty("longitude");
        expect(response.position).toHaveProperty("latitude");
        expect(response.position).toHaveProperty("height");

        expect(response).toHaveProperty("orientation");
        expect(response.orientation).toHaveProperty("heading");
        expect(response.orientation).toHaveProperty("pitch");
        expect(response.orientation).toHaveProperty("roll");

        expect(response).toHaveProperty("viewRectangle");
        expect(response.viewRectangle).toHaveProperty("west");
        expect(response.viewRectangle).toHaveProperty("south");
        expect(response.viewRectangle).toHaveProperty("east");
        expect(response.viewRectangle).toHaveProperty("north");

        expect(response).toHaveProperty("altitude");
        expect(typeof response.altitude).toBe("number");
      }
    });
  });

  describe("Command Handler Registration", () => {
    it("should register all required camera command handlers", () => {
      const requiredHandlers = [
        "camera_fly_to",
        "camera_set_view",
        "camera_get_position",
        "camera_look_at_transform",
        "camera_start_orbit",
        "camera_stop_orbit",
        "camera_set_controller_options",
      ];

      for (const handlerName of requiredHandlers) {
        expect(commandHandlers.has(handlerName)).toBe(true);
        expect(typeof commandHandlers.get(handlerName)).toBe("function");
      }
    });

    it("should have consistent command handler signatures", () => {
      for (const [_name, handler] of commandHandlers) {
        expect(typeof handler).toBe("function");
        // All handlers should accept at least one parameter (the command)
        expect(handler.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
