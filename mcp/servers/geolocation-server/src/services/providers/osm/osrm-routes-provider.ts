import { Position, Route, RouteInput } from "src/schemas/index.js";
import type { IRoutesProvider } from "../../routes-provider.interface.js";

// OSRM API response types
interface OSRMManeuver {
  location?: [number, number]; // [longitude, latitude]
  instruction?: string;
}

interface OSRMStep {
  distance?: number;
  duration?: number;
  name?: string;
  maneuver?: OSRMManeuver;
}

interface OSRMLeg {
  distance?: number;
  duration?: number;
  steps?: OSRMStep[];
}

interface OSRMRoute {
  distance?: number;
  duration?: number;
  geometry?: string;
  legs?: OSRMLeg[];
  weight_name?: string;
}

interface OSRMResponse {
  code: string;
  message?: string;
  routes?: OSRMRoute[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * OSRM (Open Source Routing Machine) Provider
 * Free and open-source routing service based on OpenStreetMap data
 *
 * Features:
 * - Multiple travel modes: driving, walking, cycling
 * - Alternative routes
 * - Step-by-step instructions
 *
 * Limitations compared to Google Routes:
 * - No real-time traffic data
 * - No transit routing
 * - Less sophisticated route optimization
 * - Limited route customization (avoid tolls/highways/ferries not supported)
 *
 * Default: Uses public OSRM demo server (https://router.project-osrm.org)
 * For production: Set OSRM_SERVER_URL to your own OSRM instance
 */
export class OSRMRoutesProvider implements IRoutesProvider {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<Route[]>> = new Map();
  private cacheDuration = 60 * 60 * 1000; // 1 hour for routes

  constructor(serverUrl?: string) {
    this.baseUrl =
      serverUrl ||
      process.env.OSRM_SERVER_URL ||
      "https://router.project-osrm.org";
    console.log(`🗺️  OSRM Routes Provider using: ${this.baseUrl}`);
  }

  /**
   * OSRM is always available (no API key required)
   */
  isConfigured(): boolean {
    return true;
  }

  getProviderName(): string {
    return "OSRM (Open Source Routing Machine)";
  }

  /**
   * Compute routes between origin and destination
   */
  async computeRoute(input: RouteInput): Promise<Route[]> {
    const cacheKey = `route:${JSON.stringify(input)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const profile = this.mapTravelMode(input.travelMode);

      // Build coordinates string
      const coords: string[] = [
        `${input.origin.longitude},${input.origin.latitude}`,
      ];

      if (input.waypoints && input.waypoints.length > 0) {
        coords.push(
          ...input.waypoints.map((wp) => `${wp.longitude},${wp.latitude}`),
        );
      }

      coords.push(
        `${input.destination.longitude},${input.destination.latitude}`,
      );

      const coordsString = coords.join(";");

      // Build query parameters
      const params = new URLSearchParams({
        overview: "full",
        geometries: "polyline",
        steps: "true",
        alternatives: input.alternatives ? "true" : "false",
      });

      // Note: OSRM doesn't support avoid options, traffic, or departure time
      if (
        input.avoidTolls ||
        input.avoidHighways ||
        input.avoidFerries ||
        input.departureTime
      ) {
        console.warn(
          "⚠️  OSRM does not support avoidTolls, avoidHighways, avoidFerries, or departureTime. These options are ignored.",
        );
      }

      const url = `${this.baseUrl}/route/v1/${profile}/${coordsString}?${params}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "CesiumJS-MCP-Server/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `OSRM API error: ${response.status} - ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OSRMResponse;

      if (data.code !== "Ok") {
        throw new Error(
          `OSRM routing error: ${data.code} - ${data.message || "Unknown error"}`,
        );
      }

      const routes = this.transformRoutes(data.routes || []);

      this.setCache(cacheKey, routes);
      return routes;
    } catch (error) {
      console.error("OSRM route computation error:", error);
      throw error;
    }
  }

  /**
   * Map travel mode to OSRM profile
   */
  private mapTravelMode(mode: string): string {
    const modeMap: Record<string, string> = {
      driving: "driving",
      walking: "foot",
      cycling: "bike",
      transit: "driving", // OSRM doesn't support transit, fallback to driving
    };
    const osrmMode = modeMap[mode] || "driving";

    if (mode === "transit") {
      console.warn(
        "⚠️  OSRM does not support transit mode. Using driving mode instead.",
      );
    }

    return osrmMode;
  }

  /**
   * Transform OSRM response to our Route schema
   */
  private transformRoutes(osrmRoutes: OSRMRoute[]): Route[] {
    return osrmRoutes.map((route) => {
      const legs = route.legs || [];

      // Calculate bounds from waypoints
      const allCoords: Position[] = [];
      legs.forEach((leg) => {
        leg.steps?.forEach((step) => {
          if (step.maneuver?.location) {
            allCoords.push({
              longitude: step.maneuver.location[0],
              latitude: step.maneuver.location[1],
              height: 0,
            });
          }
        });
      });

      const bounds = this.calculateBounds(allCoords);

      const transformed: Route = {
        summary: route.weight_name || "Route",
        distance: route.distance || 0,
        duration: route.duration || 0,
        polyline: route.geometry || "",
        bounds,
        legs: legs.map((leg) => ({
          distance: leg.distance || 0,
          duration: leg.duration || 0,
          startLocation: {
            latitude: leg.steps?.[0]?.maneuver?.location?.[1] || 0,
            longitude: leg.steps?.[0]?.maneuver?.location?.[0] || 0,
            height: 0,
          },
          endLocation: {
            latitude:
              leg.steps?.[leg.steps.length - 1]?.maneuver?.location?.[1] || 0,
            longitude:
              leg.steps?.[leg.steps.length - 1]?.maneuver?.location?.[0] || 0,
            height: 0,
          },
          steps: leg.steps
            ? leg.steps.map((step) => ({
                instruction: step.maneuver?.instruction || step.name || "",
                distance: step.distance || 0,
                duration: step.duration || 0,
              }))
            : undefined,
        })),
      };

      return transformed;
    });
  }

  /**
   * Calculate bounding box from coordinates
   */
  private calculateBounds(coords: Position[]): {
    northeast: Position;
    southwest: Position;
  } {
    if (coords.length === 0) {
      return {
        northeast: { latitude: 0, longitude: 0, height: 0 },
        southwest: { latitude: 0, longitude: 0, height: 0 },
      };
    }

    let minLat = coords[0].latitude;
    let maxLat = coords[0].latitude;
    let minLon = coords[0].longitude;
    let maxLon = coords[0].longitude;

    coords.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLon = Math.min(minLon, coord.longitude);
      maxLon = Math.max(maxLon, coord.longitude);
    });

    return {
      northeast: { latitude: maxLat, longitude: maxLon, height: 0 },
      southwest: { latitude: minLat, longitude: minLon, height: 0 },
    };
  }

  /**
   * Decode polyline string to coordinates
   * Uses the same algorithm as Google (polyline5)
   */
  decodePolyline(encoded: string): Position[] {
    const positions: Position[] = [];
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

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      positions.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
        height: 0,
      });
    }

    return positions;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string): Route[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: Route[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean old entries if cache grows too large
    if (this.cache.size > 50) {
      const oldestKeys = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 10)
        .map(([key]) => key);

      oldestKeys.forEach((key) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}
