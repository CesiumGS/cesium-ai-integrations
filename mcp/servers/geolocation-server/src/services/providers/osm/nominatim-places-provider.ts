import { SearchInput, NearbySearchInput, Place } from "src/schemas/index.js";
import type { IPlacesProvider } from "../../places-provider.interface.js";

// Nominatim (OpenStreetMap) API response types
interface NominatimNameDetails {
  name?: string;
}

interface NominatimPlace {
  place_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  namedetails?: NominatimNameDetails;
}

type NominatimPlacesResponse = NominatimPlace[];

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Nominatim (OpenStreetMap) Places Provider
 * Free geocoding and location search service
 *
 * Limitations compared to Google Places:
 * - No ratings, reviews, or user-generated content
 * - No opening hours or real-time availability
 * - No photos or price levels
 * - Limited POI data (focuses on addresses and major landmarks)
 * - Rate limit: 1 request/second for free tier
 */
export class NominatimPlacesProvider implements IPlacesProvider {
  private baseUrl = "https://nominatim.openstreetmap.org";
  private cache: Map<string, CacheEntry<Place[]>> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes
  private lastRequestTime = 0;
  private minRequestInterval = 1100; // 1.1 seconds to respect rate limit

  /**
   * Nominatim is always available (no API key required)
   * But respects usage policy and rate limits
   */
  isConfigured(): boolean {
    return true;
  }

  getProviderName(): string {
    return "Nominatim (OpenStreetMap)";
  }

  /**
   * Rate limiting: ensure at least 1 second between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Search for places by text query
   */
  async searchPlaces(input: SearchInput): Promise<Place[]> {
    const cacheKey = `search:${JSON.stringify(input)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.enforceRateLimit();

      const params = new URLSearchParams({
        q: input.query,
        format: "json",
        addressdetails: "1",
        limit: String(input.maxResults || 10),
        extratags: "1",
        namedetails: "1",
      });

      // Add location bias if provided
      if (input.location) {
        params.append("lat", String(input.location.latitude));
        params.append("lon", String(input.location.longitude));
        if (input.radius) {
          // Nominatim doesn't have radius, but we can use viewbox for bounded search
          const radiusInDegrees = input.radius / 111000; // rough conversion
          const lat = input.location.latitude;
          const lon = input.location.longitude;
          params.append(
            "viewbox",
            `${lon - radiusInDegrees},${lat + radiusInDegrees},${lon + radiusInDegrees},${lat - radiusInDegrees}`,
          );
          params.append("bounded", "1");
        }
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          "User-Agent": "CesiumJS-MCP-Server/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim API error: ${response.status} - ${response.statusText}`,
        );
      }

      const data = (await response.json()) as NominatimPlacesResponse;
      const places = this.transformPlaces(data);

      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Nominatim search error:", error);
      throw error;
    }
  }

  /**
   * Search for places near a location
   */
  async searchNearby(input: NearbySearchInput): Promise<Place[]> {
    const cacheKey = `nearby:${JSON.stringify(input)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.enforceRateLimit();

      // Convert radius to degrees (rough approximation)
      const radiusInDegrees = input.radius / 111000;
      const lat = input.location.latitude;
      const lon = input.location.longitude;

      // Build search query based on types or keyword
      let searchQuery = input.keyword || "";
      if (input.types && input.types.length > 0) {
        // Map common types to OSM amenity types
        const osmTypes = input.types.map(this.mapTypeToOSM).filter(Boolean);
        if (osmTypes.length > 0 && !searchQuery) {
          searchQuery = osmTypes[0];
        }
      }
      if (!searchQuery) {
        searchQuery = "amenity"; // search for any point of interest
      }

      const params = new URLSearchParams({
        q: searchQuery,
        format: "json",
        addressdetails: "1",
        limit: String(input.maxResults || 10),
        extratags: "1",
        namedetails: "1",
        viewbox: `${lon - radiusInDegrees},${lat + radiusInDegrees},${lon + radiusInDegrees},${lat - radiusInDegrees}`,
        bounded: "1",
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          "User-Agent": "CesiumJS-MCP-Server/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim API error: ${response.status} - ${response.statusText}`,
        );
      }

      const data = (await response.json()) as NominatimPlacesResponse;
      let places = this.transformPlaces(data);

      // Filter by actual distance since viewbox is approximate
      places = places.filter((place) => {
        const distance = this.calculateDistance(
          lat,
          lon,
          place.location.latitude,
          place.location.longitude,
        );
        return distance <= input.radius;
      });

      // Note: Nominatim doesn't support minRating or openNow
      // These features require a POI database, not just a geocoder
      if (input.minRating || input.openNow) {
        console.warn(
          "⚠️  Nominatim does not support minRating or openNow filters. These are ignored.",
        );
      }

      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Nominatim nearby search error:", error);
      throw error;
    }
  }

  /**
   * Map Google Place types to OpenStreetMap amenity types
   */
  private mapTypeToOSM(type: string): string {
    const typeMap: Record<string, string> = {
      restaurant: "restaurant",
      cafe: "cafe",
      bar: "bar",
      gym: "gym",
      hotel: "hotel",
      hospital: "hospital",
      pharmacy: "pharmacy",
      bank: "bank",
      atm: "atm",
      gas_station: "fuel",
      parking: "parking",
      shopping_mall: "mall",
      store: "shop",
      museum: "museum",
      library: "library",
      park: "park",
      tourist_attraction: "attraction",
      airport: "airport",
      transit_station: "station",
    };
    return typeMap[type] || type;
  }

  /**
   * Calculate distance between two points in meters using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Transform Nominatim response to our Place schema
   */
  private transformPlaces(apiPlaces: NominatimPlace[]): Place[] {
    return apiPlaces.map((place) => {
      const transformed: Place = {
        id: place.place_id ? String(place.place_id) : "",
        name:
          place.namedetails?.name ||
          place.display_name.split(",")[0] ||
          "Unknown",
        location: {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
          height: 0,
        },
      };

      if (place.display_name) {
        transformed.address = place.display_name;
      }

      if (place.type || place.class) {
        transformed.types = [place.type || place.class].filter(
          (t): t is string => Boolean(t),
        );
      }

      // Nominatim doesn't provide these fields - they're Google-specific
      // rating, userRatingsTotal, priceLevel, openNow, photos not available

      return transformed;
    });
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string): Place[] | null {
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
  private setCache(key: string, data: Place[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean old entries if cache grows too large
    if (this.cache.size > 100) {
      const oldestKeys = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
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
