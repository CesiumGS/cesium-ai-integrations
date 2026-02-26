import { Position, Route, RouteInput } from "../../../schemas/index.js";
import type { IRoutesProvider } from "../../routes-provider.interface.js";
import { CacheManager } from "../cache-manager.js";
import { decodePolyline } from "../polyline-utils.js";
import type {
  GoogleLocation,
  GoogleRoute,
  GoogleRoutesResponse,
  GoogleRouteRequestBody,
} from "./google-api-types.js";

/**
 * Google Routes API Provider
 * Enterprise-grade routing with real-time traffic
 *
 * Features:
 * - Real-time traffic data
 * - Multiple travel modes including transit
 * - Route optimization and alternatives
 *
 * Requires: GOOGLE_MAPS_API_KEY environment variable
 */
export class GoogleRoutesProvider implements IRoutesProvider {
  private apiKey: string;
  private baseUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
  private cacheManager: CacheManager<Route[]>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    this.cacheManager = new CacheManager<Route[]>(60 * 60 * 1000, 50, 10); // 1 hour, max 50 entries, cleanup 10
    if (!this.apiKey) {
      console.error(
        "⚠️  Google Maps API key not set. Set GOOGLE_MAPS_API_KEY environment variable.",
      );
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getProviderName(): string {
    return "Google Routes API";
  }

  /**
   * Compute routes between origin and destination
   */
  async computeRoute(input: RouteInput): Promise<Route[]> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY environment variable.",
      );
    }

    const cacheKey = `route:${JSON.stringify(input)}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const travelMode = this.mapTravelMode(input.travelMode);

      const requestBody: GoogleRouteRequestBody = {
        origin: {
          location: {
            latLng: {
              latitude: input.origin.latitude,
              longitude: input.origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: input.destination.latitude,
              longitude: input.destination.longitude,
            },
          },
        },
        travelMode,
        computeAlternativeRoutes: input.alternatives || false,
        routeModifiers: {},
      };

      // Only add routing preference for DRIVE mode (WALK and BICYCLE don't support it)
      if (travelMode === "DRIVE") {
        requestBody.routingPreference = "TRAFFIC_AWARE";
      }

      // Add waypoints if provided
      if (input.waypoints && input.waypoints.length > 0) {
        requestBody.intermediates = input.waypoints.map((wp) => ({
          location: {
            latLng: {
              latitude: wp.latitude,
              longitude: wp.longitude,
            },
          },
        }));
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline,routes.legs,routes.viewport,routes.warnings,routes.description",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Routes API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as GoogleRoutesResponse;
      const routes = this.transformRoutes(data.routes || []);

      this.cacheManager.set(cacheKey, routes);
      return routes;
    } catch (error) {
      console.error("Google Routes computation error:", error);
      throw error;
    }
  }

  /**
   * Map travel mode to Google Routes API format
   */
  private mapTravelMode(mode: string): string {
    const modeMap: Record<string, string> = {
      driving: "DRIVE",
      walking: "WALK",
      cycling: "BICYCLE",
      transit: "TRANSIT",
    };
    return modeMap[mode] || "DRIVE";
  }

  /**
   * Transform Google Routes API response to our Route schema
   */
  private transformRoutes(apiRoutes: GoogleRoute[]): Route[] {
    return apiRoutes.map((route) => {
      const legs = route.legs || [];

      // Calculate bounds from viewport
      const viewport = route.viewport || {};
      const bounds = {
        northeast: {
          latitude: viewport.high?.latitude || 0,
          longitude: viewport.high?.longitude || 0,
          height: 0,
        },
        southwest: {
          latitude: viewport.low?.latitude || 0,
          longitude: viewport.low?.longitude || 0,
          height: 0,
        },
      };

      const transformed: Route = {
        summary: route.description || "Route",
        distance: route.distanceMeters || 0,
        duration: this.parseDuration(route.duration),
        polyline: route.polyline?.encodedPolyline || "",
        bounds,
        legs: legs.map((leg) => ({
          distance: leg.distanceMeters || 0,
          duration: this.parseDuration(leg.duration),
          startLocation: this.extractLocation(leg.startLocation),
          endLocation: this.extractLocation(leg.endLocation),
          steps: leg.steps
            ? leg.steps.map((step) => ({
                instruction: step.navigationInstruction?.instructions || "",
                distance: step.distanceMeters || 0,
                duration: this.parseDuration(step.staticDuration),
              }))
            : undefined,
        })),
      };

      if (route.warnings && route.warnings.length > 0) {
        transformed.warnings = route.warnings;
      }

      // Add traffic info if available
      if (route.travelAdvisory) {
        transformed.trafficInfo = {
          durationInTraffic: this.parseDuration(route.travelAdvisory.duration),
        };
      }

      return transformed;
    });
  }

  /**
   * Parse duration string (e.g., "123s") to seconds
   */
  private parseDuration(duration: string | undefined): number {
    if (!duration) {
      return 0;
    }
    const match = duration.match(/^(\d+)s?$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extract location from API location object
   */
  private extractLocation(location: GoogleLocation | undefined): Position {
    const latLng = location?.latLng || { latitude: 0, longitude: 0 };
    return {
      latitude: latLng.latitude || 0,
      longitude: latLng.longitude || 0,
      height: 0,
    };
  }

  /**
   * Decode polyline string to coordinates
   * Uses shared polyline decoder utility
   */
  decodePolyline(encoded: string): Position[] {
    return decodePolyline(encoded);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cacheManager.clear();
  }
}
