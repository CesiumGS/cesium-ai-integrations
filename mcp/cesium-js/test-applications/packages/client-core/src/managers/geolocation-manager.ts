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
  addPointEntity,
  addLabelEntity,
} from "../shared/entity-utils.js";
import { flyToBoundingBox } from "../shared/camera-utils.js";
import {
  createPlaceMarkerConfig,
  getTravelModeColor,
  formatRouteSummary,
  isGeolocationAvailable,
  isLocationCacheFresh,
} from "../shared/geolocation-utils.js";
import {
  validatePosition,
  validatePositions,
} from "../shared/validation-utils.js";

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

      // Validate location coordinates
      const validation = validatePosition(location);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid location: ${validation.error}`,
          entityCount: 0,
        };
      }

      // Clear previous geocode markers
      removeEntitiesByIds(this.viewer, this.geocodeEntityIds);
      this.geocodeEntityIds = [];

      // Create a marker for the geocoded location
      const pointEntityId = `geocode_point_${Date.now()}`;
      const pointEntity = addPointEntity(this.viewer, location, {
        id: pointEntityId,
        name: displayName || "Geocoded Location",
        color: "red",
        pixelSize: 15,
        outlineColor: "white",
        outlineWidth: 2,
      });
      this.geocodeEntityIds.push(pointEntity.id);

      // Add label for the location
      const labelEntityId = `geocode_label_${Date.now()}`;
      const labelEntity = addLabelEntity(
        this.viewer,
        location,
        displayName || "Location",
        {
          id: labelEntityId,
          font: "16pt sans-serif",
          fillColor: "white",
          outlineColor: "black",
          outlineWidth: 3,
          pixelOffset: { x: 0, y: -20 },
        },
      );
      this.geocodeEntityIds.push(labelEntity.id);

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

      // Validate all place locations
      const invalidPlaces = places.filter(
        (place) => !validatePosition(place.location).valid,
      );
      if (invalidPlaces.length > 0) {
        console.warn(
          `Skipping ${invalidPlaces.length} place(s) with invalid coordinates`,
          invalidPlaces.map((p) => p.name),
        );
      }

      // Filter to only valid places
      const validPlaces = places.filter(
        (place) => validatePosition(place.location).valid,
      );

      // Add markers for each place
      for (const place of validPlaces) {
        // Get marker configuration using utility
        const markerConfig = createPlaceMarkerConfig(
          place.name,
          place.types,
          place.rating,
        );

        // Create point marker
        const pointEntityId = `place_point_${place.id}_${Date.now()}`;
        const pointEntity = addPointEntity(this.viewer, place.location, {
          id: pointEntityId,
          name: place.name,
          color: markerConfig.color,
          pixelSize: 12,
          outlineColor: "white",
          outlineWidth: 2,
        });
        this.placeEntityIds.push(pointEntity.id);

        // Create label
        const labelEntityId = `place_label_${place.id}_${Date.now()}`;
        const labelEntity = addLabelEntity(
          this.viewer,
          place.location,
          markerConfig.labelText,
          {
            id: labelEntityId,
            font: "14pt sans-serif",
            fillColor: "white",
            outlineColor: "black",
            outlineWidth: 3,
            pixelOffset: { x: 0, y: -15 },
          },
        );
        this.placeEntityIds.push(labelEntity.id);
      }

      // Fly to view all places
      if (validPlaces.length > 0) {
        flyToBoundingBox(
          this.viewer,
          validPlaces.map((p) => p.location),
          2,
        );
      }

      return {
        success: true,
        message: `Visualized ${validPlaces.length} place(s)${invalidPlaces.length > 0 ? ` (skipped ${invalidPlaces.length} invalid)` : ""}`,
        entityCount: validPlaces.length,
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

      // Validate route positions
      const positionsValidation = validatePositions(route.positions);
      if (!positionsValidation.valid) {
        return {
          success: false,
          error: `Invalid route positions: ${positionsValidation.error}`,
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
      const summary = formatRouteSummary(route.distance, route.duration);

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
   * Add start and end markers for a route
   */
  private addRouteMarkers(route: Route, showLabels: boolean): void {
    const startPos = route.positions[0];
    const endPos = route.positions[route.positions.length - 1];

    // Start marker (green point)
    const startPointId = `route_start_point_${Date.now()}`;
    const startPointEntity = addPointEntity(this.viewer, startPos, {
      id: startPointId,
      name: "Start",
      color: "green",
      pixelSize: 15,
      outlineColor: "white",
      outlineWidth: 3,
    });
    this.routeEntityIds.push(startPointEntity.id);

    // Start label
    if (showLabels) {
      const startLabelId = `route_start_label_${Date.now()}`;
      const startLabelEntity = addLabelEntity(this.viewer, startPos, "Start", {
        id: startLabelId,
        font: "16pt sans-serif",
        fillColor: "white",
        outlineColor: "black",
        outlineWidth: 3,
        pixelOffset: { x: 0, y: -25 },
      });
      this.routeEntityIds.push(startLabelEntity.id);
    }

    // End marker (red point)
    const endPointId = `route_end_point_${Date.now()}`;
    const endPointEntity = addPointEntity(this.viewer, endPos, {
      id: endPointId,
      name: "End",
      color: "red",
      pixelSize: 15,
      outlineColor: "white",
      outlineWidth: 3,
    });
    this.routeEntityIds.push(endPointEntity.id);

    // End label
    if (showLabels) {
      const endLabelId = `route_end_label_${Date.now()}`;
      const endLabelEntity = addLabelEntity(this.viewer, endPos, "End", {
        id: endLabelId,
        font: "16pt sans-serif",
        fillColor: "white",
        outlineColor: "black",
        outlineWidth: 3,
        pixelOffset: { x: 0, y: -25 },
      });
      this.routeEntityIds.push(endLabelEntity.id);
    }
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
