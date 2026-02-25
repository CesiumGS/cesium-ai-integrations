import type { SearchInput, NearbySearchInput, Place } from "../schemas/index.js";

/** Shape of a place object returned by the Google Places API (New) */
interface GoogleApiPlace {
  id?: string;
  name?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  currentOpeningHours?: { openNow?: boolean };
  photos?: { name?: string }[];
}

/**
 * Google Places API Service
 * Handles text search, nearby search, and place details retrieval
 */
export class PlacesService {
  private apiKey: string;
  private baseUrl = "https://places.googleapis.com/v1";
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      console.error(
        "⚠️  Google Maps API key not set. Geolocation features will be limited.",
      );
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
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
    const cached = this.getFromCache(cacheKey) as Place[] | null;
    if (cached) {
      return cached;
    }

    try {
      const requestBody: Record<string, unknown> = {
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
        throw new Error(`Places API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const places = this.transformPlaces(
        (data.places as GoogleApiPlace[]) || [],
      );

      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Places search error:", error);
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
    const cached = this.getFromCache(cacheKey) as Place[] | null;
    if (cached) {
      return cached;
    }

    try {
      const requestBody: Record<string, unknown> = {
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
        throw new Error(`Places API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      let places = this.transformPlaces(
        (data.places as GoogleApiPlace[]) || [],
      );

      // Filter by openNow if specified
      if (input.openNow) {
        places = places.filter((p) => p.openNow === true);
      }

      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Nearby search error:", error);
      throw error;
    }
  }

  /**
   * Transform Google Places API response to our Place schema
   */
  private transformPlaces(apiPlaces: GoogleApiPlace[]): Place[] {
    return apiPlaces.map((place) => {
      const location = place.location || {};
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
        transformed.photos = place.photos.map((photo) => photo.name || "");
      }

      return transformed;
    });
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string): unknown | null {
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
  private setCache(key: string, data: unknown): void {
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
