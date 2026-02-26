/**
 * Cesium Geolocation Manager Module
 * Handles browser geolocation, place visualization, and route rendering
 */

import type {
  CommandHandler,
  ManagerInterface,
  Position,
  MCPCommand,
} from "../types/mcp.js";
import type { CesiumViewer } from "../types/cesium-types.js";
import type { Color } from "cesium";

import type {
  Place,
  Route,
  RouteVisualizationOptions,
  UserLocation,
  UserLocationResult,
  VisualizePlacesResult,
  VisualizeRouteResult,
  ClearVisualizationResult,
  GeocodeLocationResult,
} from "../types/geolocation.js";

import {
  addPolylineEntity,
  removeEntitiesByIds,
  createLabelGraphics,
  addBillboardPinEntity,
} from "../shared/entity-utils.js";
import { flyToBoundingBox } from "../shared/camera-utils.js";
import {
  createPlaceMarkerConfig,
  getTravelModeColor,
  formatRouteSummary,
  isGeolocationAvailable,
  isLocationCacheFresh,
} from "../shared/geolocation-utils.js";

class CesiumGeolocationManager implements ManagerInterface {
  private viewer: CesiumViewer;
  private handlers: Map<string, CommandHandler>;
  private currentLocation: UserLocation | null = null;
  private routeEntityIds: string[] = [];
  private placeEntityIds: string[] = [];
  private geocodeEntityIds: string[] = [];
  private readonly LOCATION_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
    this.handlers = new Map<string, CommandHandler>();
  }

  /**
   * Setup and register command handlers
   */
  setUp(): void {
    // Register handlers (matching tool names from geolocation-server)
    this.handlers.set(
      "geolocation_get_user_location",
      this.getUserLocation.bind(this),
    );
    this.handlers.set("geolocation_search", this.visualizePlaces.bind(this));
    this.handlers.set("geolocation_nearby", this.visualizePlaces.bind(this));
    this.handlers.set("geolocation_route", this.visualizeRoute.bind(this));
    this.handlers.set(
      "geolocation_geocode",
      this.visualizeGeocodedLocation.bind(this),
    );
  }

  /**
   * Cleanup
   */
  shutdown(): void {
    this.clearVisualization();
  }

  /**
   * Get command handlers
   */
  getCommandHandlers(): Map<string, CommandHandler> {
    return this.handlers;
  }

  /**
   * Get user's current location from browser geolocation API
   */
  private async getUserLocation(): Promise<UserLocationResult> {
    return new Promise((resolve) => {
      if (!isGeolocationAvailable()) {
        resolve({
          success: false,
          error: "Geolocation not supported by this browser",
        });
        return;
      }

      // Check if we have a recent cached location
      if (
        this.currentLocation &&
        isLocationCacheFresh(
          this.currentLocation.timestamp,
          this.LOCATION_CACHE_MAX_AGE,
        )
      ) {
        resolve({
          success: true,
          location: this.currentLocation.position,
          accuracy: this.currentLocation.accuracy,
          message: "Using cached location",
          cached: true,
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            height: position.coords.altitude || 0,
          };

          // Cache the location
          this.currentLocation = {
            position: location,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };

          resolve({
            success: true,
            location,
            accuracy: position.coords.accuracy,
            message: "Location acquired",
          });
        },
        (error) => {
          const errorMessage = this.getGeolocationErrorMessage(error);
          resolve({
            success: false,
            error: errorMessage,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }

  /**
   * Get user-friendly error message from geolocation error
   */
  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission denied by user";
      case error.POSITION_UNAVAILABLE:
        return "Location information unavailable";
      case error.TIMEOUT:
        return "Location request timed out";
      default:
        return "Failed to get location";
    }
  }

  /**
   * Visualize a geocoded location and fly to it
   */
  private async visualizeGeocodedLocation(
    cmd: MCPCommand,
  ): Promise<GeocodeLocationResult> {
    console.log(
      "📍 Geolocation Manager: visualizeGeocodedLocation called",
      cmd,
    );
    try {
      const location = cmd.location as Position | undefined;
      const displayName = cmd.displayName as string | undefined;
      const address = cmd.address as string | undefined;
      const boundingBox = cmd.boundingBox as
        | { northeast: Position; southwest: Position }
        | undefined;

      if (!location) {
        return {
          success: false,
          error: "No location provided",
          entityCount: 0,
        };
      }

      // Clear previous geocode markers
      removeEntitiesByIds(this.viewer, this.geocodeEntityIds);
      this.geocodeEntityIds = [];

      // Create a marker for the geocoded location using a map pin
      const entityId = `geocode_${Date.now()}`;

      const entity = addBillboardPinEntity(this.viewer, location, {
        id: entityId,
        name: displayName || "Geocoded Location",
        color: "red",
        size: 48,
        label: createLabelGraphics(displayName || "Location", {
          font: "18px sans-serif",
          fillColor: "black",
          outlineColor: "white",
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -40),
        }),
      });

      this.geocodeEntityIds.push(entity.id);

      // Fly to the location
      // If boundingBox is available, fly to it. Otherwise, fly to the single location.
      if (boundingBox) {
        // Convert bounding box to array of positions for flyToBoundingBox
        flyToBoundingBox(
          this.viewer,
          [boundingBox.northeast, boundingBox.southwest],
          2.5,
        );
      } else {
        // Fly to single location with appropriate height
        flyToBoundingBox(this.viewer, [location], 1.5);
      }

      return {
        success: true,
        message: `Geocoded location: ${displayName || "Location"}${address ? ` (${address})` : ""}`,
        entityCount: 1,
        location,
        displayName,
        address,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        entityCount: 0,
      };
    }
  }

  /**
   * Visualize multiple places on the map
   */
  private async visualizePlaces(
    cmd: MCPCommand,
  ): Promise<VisualizePlacesResult> {
    console.log("🗺️ Geolocation Manager: visualizePlaces called", cmd);
    try {
      const places: Place[] = (cmd.places as Place[]) || [];

      if (places.length === 0) {
        return {
          success: true,
          message: "No places to visualize",
          entityCount: 0,
        };
      }

      // Clear previous place markers
      removeEntitiesByIds(this.viewer, this.placeEntityIds);
      this.placeEntityIds = [];

      // Add markers for each place using map pins
      for (const place of places) {
        const entityId = `place_${place.id}_${Date.now()}`;

        // Get marker configuration using utility
        const markerConfig = createPlaceMarkerConfig(
          place.name,
          place.types,
          place.rating,
        );

        // Create billboard pin marker with label
        const entity = addBillboardPinEntity(this.viewer, place.location, {
          id: entityId,
          name: place.name,
          color: markerConfig.color,
          size: 48,
          label: createLabelGraphics(markerConfig.labelText, {
            font: "18px sans-serif",
            fillColor: "black",
            outlineColor: "white",
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -40),
          }),
        });

        this.placeEntityIds.push(entity.id);
      }

      // Fly to view all places
      if (places.length > 0) {
        flyToBoundingBox(
          this.viewer,
          places.map((p) => p.location),
          2,
        );
      }

      return {
        success: true,
        message: `Visualized ${places.length} place(s)`,
        entityCount: places.length,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        entityCount: 0,
      };
    }
  }

  /**
   * Visualize a route on the map
   */
  private async visualizeRoute(cmd: MCPCommand): Promise<VisualizeRouteResult> {
    try {
      const route: Route = cmd.route as Route;
      const options: RouteVisualizationOptions =
        (cmd.options as RouteVisualizationOptions) || {};

      if (!route?.positions || route.positions.length === 0) {
        return {
          success: false,
          error: "No route positions provided",
        };
      }

      // Only clear previous routes if requested (default: true)
      const clearPrevious = options.clearPrevious !== false;
      if (clearPrevious) {
        removeEntitiesByIds(this.viewer, this.routeEntityIds);
        this.routeEntityIds = [];
      }

      // Determine color based on travel mode using utility
      const routeColor: Color = options.routeColor
        ? Cesium.Color.fromCssColorString(options.routeColor)
        : getTravelModeColor(route.travelMode);

      // Create polyline for the route
      const polylineEntity = addPolylineEntity(this.viewer, route.positions, {
        id: `route_polyline_${Date.now()}`,
        name: `Route: ${route.summary}`,
        width: options.routeWidth || 5,
        color: routeColor,
        clampToGround: true,
      });

      this.routeEntityIds.push(polylineEntity.id);

      // Add start and end markers if requested
      if (options.showMarkers) {
        this.addRouteMarkers(route, options.showLabels || false);
      }

      // Fly to view the route if requested
      if (options.flyToRoute) {
        flyToBoundingBox(this.viewer, route.positions, 2);
      }

      // Format message using utility
      const summary = formatRouteSummary(
        route.distance,
        route.duration,
        route.travelMode,
      );

      return {
        success: true,
        message: `Route visualized: ${summary}`,
        entityCount: this.routeEntityIds.length,
        distance: route.distance,
        duration: route.duration,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add start and end markers for a route using map pins
   */
  private addRouteMarkers(route: Route, showLabels: boolean): void {
    const startPos = route.positions[0];
    const endPos = route.positions[route.positions.length - 1];

    // Start marker (green pin with "S" text)
    const startEntity = addBillboardPinEntity(this.viewer, startPos, {
      id: `route_start_${Date.now()}`,
      name: "Start",
      color: "green",
      text: "S",
      size: 48,
      ...(showLabels
        ? {
            label: createLabelGraphics("Start", {
              font: "18px sans-serif",
              fillColor: "black",
              outlineColor: "white",
              outlineWidth: 2,
              pixelOffset: new Cesium.Cartesian2(0, -40),
            }),
          }
        : {}),
    });

    this.routeEntityIds.push(startEntity.id);

    // End marker (red pin with "E" text)
    const endEntity = addBillboardPinEntity(this.viewer, endPos, {
      id: `route_end_${Date.now()}`,
      name: "End",
      color: "red",
      text: "E",
      size: 48,
      ...(showLabels
        ? {
            label: createLabelGraphics("End", {
              font: "18px sans-serif",
              fillColor: "black",
              outlineColor: "white",
              outlineWidth: 2,
              pixelOffset: new Cesium.Cartesian2(0, -40),
            }),
          }
        : {}),
    });
    this.routeEntityIds.push(endEntity.id);
  }

  /**
   * Clear all geolocation visualizations
   */
  private async clearVisualization(): Promise<ClearVisualizationResult> {
    try {
      // Remove all entities
      const allEntityIds = [
        ...this.routeEntityIds,
        ...this.placeEntityIds,
        ...this.geocodeEntityIds,
      ];
      const removedCount = removeEntitiesByIds(this.viewer, allEntityIds);

      this.routeEntityIds = [];
      this.placeEntityIds = [];
      this.geocodeEntityIds = [];

      return {
        success: true,
        message: `Cleared all geolocation visualizations (${removedCount} entities removed)`,
        removedCount,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        removedCount: 0,
      };
    }
  }
}

export { CesiumGeolocationManager };
