import "dotenv/config";
import { Position, Route, RouteInput } from "../../../schemas/index.js";
import type { IRoutesProvider } from "../../routes-provider.interface.js";
import { CacheManager } from "../cache-manager.js";
import { decodePolyline } from "../polyline-utils.js";
import { calculateBounds } from "../geospatial-utils.js";
import { getUserAgent } from "./osm-utils.js";
import type {
  OSRMRoute,
  OSRMResponse,
  OSRMStep,
  OSRMLeg,
} from "./types/osrm-api-types.js";

/**
 * OSRM (Open Source Routing Machine) Provider
 * Free and open-source routing service based on OpenStreetMap data
 *
 * Features:
 * - Multiple travel modes: driving, walking, cycling
 * - Alternative routes
 * - Step-by-step instructions
 *
 * Default: Uses public OSRM demo server (https://router.project-osrm.org)
 * For production: Set OSRM_SERVER_URL to your own OSRM instance
 */
export class OSRMRoutesProvider implements IRoutesProvider {
  private baseUrl: string;
  private cacheManager: CacheManager<Route[]>;
  private userAgent: string;

  constructor(serverUrl?: string) {
    this.baseUrl =
      serverUrl ||
      process.env.OSRM_SERVER_URL ||
      "https://router.project-osrm.org";
    this.cacheManager = new CacheManager<Route[]>(60 * 60 * 1000, 50, 10); // 1 hour, max 50 entries, cleanup 10
    this.userAgent = getUserAgent();
    console.error(`🗺️  OSRM Routes Provider using: ${this.baseUrl}`);
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
    const cached = this.cacheManager.get(cacheKey);
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
        overview: "full", // Return full geometry
        geometries: "polyline", // Use polyline encoding (precision 5)
        steps: "true", // Return turn-by-turn instructions
        alternatives: input.alternatives ? "true" : "false", // Alternative routes
        // Note: annotations=true would provide additional metadata (node IDs, per-segment data)
        // but is not currently needed for basic routing
      });

      const url = `${this.baseUrl}/route/v1/${profile}/${coordsString}?${params}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
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

      this.cacheManager.set(cacheKey, routes);
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
   * Build human-readable instruction from OSRM maneuver
   */
  private buildInstruction(
    maneuverType?: string,
    modifier?: string,
    streetName?: string,
    exit?: number,
  ): string {
    if (!maneuverType) {
      return streetName || "Continue";
    }

    // Handle special maneuver types
    switch (maneuverType) {
      case "depart":
        return `Head ${modifier || ""}`.trim();

      case "arrive":
        return "Arrive at destination";

      case "roundabout":
      case "rotary":
        if (exit !== undefined) {
          return `Take exit ${exit} at roundabout${streetName ? ` onto ${streetName}` : ""}`;
        }
        return `Enter roundabout${streetName ? ` onto ${streetName}` : ""}`;

      case "roundabout turn":
        return `At roundabout, turn ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "merge":
        return `Merge ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "on ramp":
      case "on_ramp":
        return `Take ramp ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "off ramp":
      case "off_ramp":
        return `Take exit ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "fork":
        return `At fork, keep ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "end of road":
        return `At end of road, turn ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "use lane":
        return `Use lane${streetName ? ` to continue on ${streetName}` : ""}`;

      case "continue":
        return `Continue ${modifier || ""}${streetName ? ` on ${streetName}` : ""}`.trim();

      case "turn":
        if (modifier === "straight") {
          return `Continue straight${streetName ? ` on ${streetName}` : ""}`;
        }
        return `Turn ${modifier || ""}${streetName ? ` onto ${streetName}` : ""}`.trim();

      case "new name":
        return streetName
          ? `Continue onto ${streetName}`
          : "Continue on same road";

      case "notification":
        return streetName || "Continue";

      default:
        // Fallback for unknown maneuver types
        if (modifier && streetName) {
          return `${modifier} onto ${streetName}`;
        } else if (streetName) {
          return `Continue on ${streetName}`;
        } else if (modifier) {
          return `Go ${modifier}`;
        }
        return "Continue";
    }
  }

  /**
   * Transform OSRM response to our Route schema
   */
  private transformRoutes(osrmRoutes: OSRMRoute[]): Route[] {
    return osrmRoutes.map((route) => {
      const legs = route.legs || [];

      // Build route summary from leg summaries or major road names
      let summary = "Route";
      if (legs.length > 0) {
        // Collect major road names from leg summaries
        const summaries = legs
          .map((leg) => leg.summary)
          .filter((s) => s && s.trim().length > 0);

        if (summaries.length > 0) {
          summary = summaries.join(" → ");
        } else {
          // Fallback: collect unique road names from steps
          const roadNames = new Set<string>();
          legs.forEach((leg) => {
            leg.steps?.forEach((step) => {
              if (step.name && step.name.trim().length > 0) {
                roadNames.add(step.name);
              }
            });
          });

          if (roadNames.size > 0) {
            // Take up to 3 major road names
            const majorRoads = Array.from(roadNames).slice(0, 3);
            summary = majorRoads.join(", ");
          }
        }
      }

      // Calculate bounds from waypoints
      const allCoords: Position[] = [];
      legs.forEach((leg: OSRMLeg) => {
        leg.steps?.forEach((step: OSRMStep) => {
          if (step.maneuver?.location) {
            allCoords.push({
              longitude: step.maneuver.location[0],
              latitude: step.maneuver.location[1],
              height: 0,
            });
          }
        });
      });

      const bounds = calculateBounds(allCoords);

      const transformed: Route = {
        summary,
        distance: route.distance || 0,
        duration: route.duration || 0,
        polyline: route.geometry || "",
        bounds,
        legs: legs.map((leg: OSRMLeg) => ({
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
            ? leg.steps.map((step: OSRMStep) => ({
                instruction: this.buildInstruction(
                  step.maneuver?.type,
                  step.maneuver?.modifier,
                  step.name,
                  step.maneuver?.exit,
                ),
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
