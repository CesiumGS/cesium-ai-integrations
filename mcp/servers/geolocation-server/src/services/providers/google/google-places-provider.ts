import { SearchInput, NearbySearchInput, Place } from "src/schemas/index.js";
import type { IPlacesProvider } from "../../places-provider.interface.js";

// Google Places API response types
interface GoogleDisplayName {
  text?: string;
}

interface GoogleLatLng {
  latitude: number;
  longitude: number;
}

interface GoogleOpeningHours {
  openNow?: boolean;
}

interface GooglePhoto {
  name: string;
}

interface GooglePlace {
  id?: string;
  displayName?: GoogleDisplayName;
  name?: string;
  formattedAddress?: string;
  location?: GoogleLatLng;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  currentOpeningHours?: GoogleOpeningHours;
  photos?: GooglePhoto[];
}

interface GooglePlacesResponse {
  places: GooglePlace[];
}

interface GoogleTextSearchRequestBody {
  textQuery: string;
  maxResultCount: number;
  locationBias?: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
}

interface GoogleNearbySearchRequestBody {
  maxResultCount: number;
  locationRestriction: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  includedTypes?: string[];
  textQuery?: string;
  minRating?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Google Places API Provider
 * Full-featured POI database with rich metadata
 *
 * Features:
 * - Comprehensive place database
 * - Ratings, reviews, and user-generated content
 * - Opening hours and real-time availability
 * - Photos and price levels
 * - High-quality geocoding
 *
 * Requires: GOOGLE_MAPS_API_KEY environment variable
 */
export class GooglePlacesProvider implements IPlacesProvider {
  private apiKey: string;
  private baseUrl = "https://places.googleapis.com/v1";
  private cache: Map<string, CacheEntry<Place[]>> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
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
    return "Google Places API";
  }

  /**
   * Text search for places
   */
  async searchPlaces(input: SearchInput): Promise<Place[]> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY environment variable.",
      );
    }

    const cacheKey = `search:${JSON.stringify(input)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const requestBody: GoogleTextSearchRequestBody = {
        textQuery: input.query,
        maxResultCount: input.maxResults || 10,
      };

      if (input.location) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: input.location.latitude,
              longitude: input.location.longitude,
            },
            radius: input.radius || 5000,
          },
        };
      }

      const response = await fetch(`${this.baseUrl}/places:searchText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.photos",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Places API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as GooglePlacesResponse;
      const places = this.transformPlaces(data.places || []);

      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Google Places search error:", error);
      throw error;
    }
  }

  /**
   * Nearby search for places
   */
  async searchNearby(input: NearbySearchInput): Promise<Place[]> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY environment variable.",
      );
    }

    const cacheKey = `nearby:${JSON.stringify(input)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const requestBody: GoogleNearbySearchRequestBody = {
        maxResultCount: input.maxResults || 10,
        locationRestriction: {
          circle: {
            center: {
              latitude: input.location.latitude,
              longitude: input.location.longitude,
            },
            radius: input.radius || 5000,
          },
        },
      };

      if (input.types && input.types.length > 0) {
        requestBody.includedTypes = input.types;
      }

      if (input.keyword) {
        requestBody.textQuery = input.keyword;
      }

      if (input.minRating) {
        requestBody.minRating = input.minRating;
      }

      const response = await fetch(`${this.baseUrl}/places:searchNearby`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.photos",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Places API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as GooglePlacesResponse;
      let places = this.transformPlaces(data.places || []);

      // Filter by openNow if specified
      if (input.openNow) {
        places = places.filter((p) => p.openNow === true);
      }

      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Google Places nearby search error:", error);
      throw error;
    }
  }

  /**
   * Transform Google Places API response to our Place schema
   */
  private transformPlaces(apiPlaces: GooglePlace[]): Place[] {
    return apiPlaces.map((place) => {
      const location = place.location || { latitude: 0, longitude: 0 };
      const transformed: Place = {
        id: place.id || "",
        name: place.displayName?.text || place.name || "Unknown",
        location: {
          latitude: location.latitude || 0,
          longitude: location.longitude || 0,
          height: 0,
        },
      };

      if (place.formattedAddress) {
        transformed.address = place.formattedAddress;
      }

      if (place.types) {
        transformed.types = place.types;
      }

      if (typeof place.rating === "number") {
        transformed.rating = place.rating;
      }

      if (typeof place.userRatingCount === "number") {
        transformed.userRatingsTotal = place.userRatingCount;
      }

      if (typeof place.priceLevel === "number") {
        transformed.priceLevel = place.priceLevel;
      }

      if (place.currentOpeningHours) {
        transformed.openNow = place.currentOpeningHours.openNow || false;
      }

      if (place.photos && place.photos.length > 0) {
        transformed.photos = place.photos.map((photo) => photo.name);
      }

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
