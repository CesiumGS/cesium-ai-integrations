import type { RouteInput, Route, Position } from '../schemas.js';

/**
 * Google Routes API Service
 * Handles route computation with multiple travel modes
 */
export class RoutesService {
  private apiKey: string;
  private baseUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 60 * 60 * 1000; // 1 hour for routes

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.error('⚠️  Google Maps API key not set. Routing features will be limited.');
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Compute routes between origin and destination
   */
  async computeRoute(input: RouteInput): Promise<Route[]> {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY environment variable.');
    }

    const cacheKey = `route:${JSON.stringify(input)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const travelMode = this.mapTravelMode(input.travelMode);
      
      const requestBody: any = {
        origin: {
          location: {
            latLng: {
              latitude: input.origin.latitude,
              longitude: input.origin.longitude
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: input.destination.latitude,
              longitude: input.destination.longitude
            }
          }
        },
        travelMode,
        computeAlternativeRoutes: input.alternatives || false,
        routeModifiers: {}
      };

      // Only add routing preference for DRIVE mode (WALK and BICYCLE don't support it)
      if (travelMode === 'DRIVE') {
        requestBody.routingPreference = 'TRAFFIC_AWARE';
      }

      // Add waypoints if provided
      if (input.waypoints && input.waypoints.length > 0) {
        requestBody.intermediates = input.waypoints.map(wp => ({
          location: {
            latLng: {
              latitude: wp.latitude,
              longitude: wp.longitude
            }
          }
        }));
      }

      // Route modifiers
      if (input.avoidTolls) {
        requestBody.routeModifiers.avoidTolls = true;
      }
      if (input.avoidHighways) {
        requestBody.routeModifiers.avoidHighways = true;
      }
      if (input.avoidFerries) {
        requestBody.routeModifiers.avoidFerries = true;
      }

      // Departure time for traffic-aware routing
      if (input.departureTime) {
        requestBody.departureTime = input.departureTime;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline,routes.legs,routes.viewport,routes.warnings,routes.description'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Routes API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const routes = this.transformRoutes(data.routes || []);
      
      this.setCache(cacheKey, routes);
      return routes;
    } catch (error) {
      console.error('Route computation error:', error);
      throw error;
    }
  }

  /**
   * Map travel mode to Google Routes API format
   */
  private mapTravelMode(mode: string): string {
    const modeMap: Record<string, string> = {
      'driving': 'DRIVE',
      'walking': 'WALK',
      'cycling': 'BICYCLE',
      'transit': 'TRANSIT'
    };
    return modeMap[mode] || 'DRIVE';
  }

  /**
   * Transform Google Routes API response to our Route schema
   */
  private transformRoutes(apiRoutes: any[]): Route[] {
    return apiRoutes.map(route => {
      const legs = route.legs || [];
      
      // Calculate bounds from viewport
      const viewport = route.viewport || {};
      const bounds = {
        northeast: {
          latitude: viewport.high?.latitude || 0,
          longitude: viewport.high?.longitude || 0
        },
        southwest: {
          latitude: viewport.low?.latitude || 0,
          longitude: viewport.low?.longitude || 0
        }
      };

      const transformed: Route = {
        summary: route.description || 'Route',
        distance: route.distanceMeters || 0,
        duration: this.parseDuration(route.duration),
        polyline: route.polyline?.encodedPolyline || '',
        bounds,
        legs: legs.map((leg: any) => ({
          distance: leg.distanceMeters || 0,
          duration: this.parseDuration(leg.duration),
          startLocation: this.extractLocation(leg.startLocation),
          endLocation: this.extractLocation(leg.endLocation),
          steps: leg.steps ? leg.steps.map((step: any) => ({
            instruction: step.navigationInstruction?.instructions || '',
            distance: step.distanceMeters || 0,
            duration: this.parseDuration(step.staticDuration)
          })) : undefined
        }))
      };

      if (route.warnings && route.warnings.length > 0) {
        transformed.warnings = route.warnings;
      }

      // Add traffic info if available
      if (route.travelAdvisory) {
        transformed.trafficInfo = {
          durationInTraffic: this.parseDuration(route.travelAdvisory.duration)
        };
      }

      return transformed;
    });
  }

  /**
   * Parse duration string (e.g., "123s") to seconds
   */
  private parseDuration(duration: string | undefined): number {
    if (!duration) return 0;
    const match = duration.match(/^(\d+)s?$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extract location from API location object
   */
  private extractLocation(location: any): Position {
    const latLng = location?.latLng || {};
    return {
      latitude: latLng.latitude || 0,
      longitude: latLng.longitude || 0,
      height: 0
    };
  }

  /**
   * Decode polyline string to coordinates
   * Uses Google's encoded polyline algorithm
   */
  static decodePolyline(encoded: string): Position[] {
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
   * Get data from cache if not expired
   */
  private getFromCache(key: string): any | null {
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
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Clean old entries if cache grows too large
    if (this.cache.size > 50) {
      const oldestKeys = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 10)
        .map(([key]) => key);
      
      oldestKeys.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}
