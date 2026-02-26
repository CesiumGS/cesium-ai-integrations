import { SearchInput, GeocodeInput, Place } from "../../../schemas/index.js";
import type {
  IPlacesProvider,
  GeocodeResult,
} from "../../places-provider.interface.js";
import { CacheManager } from "../cache-manager.js";
import type {
  GooglePlace,
  GooglePlacesResponse,
  GoogleTextSearchRequestBody,
  GoogleNearbySearchRequestBody,
} from "./google-api-types.js";

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
  private cacheManager: CacheManager<Place[]>;
  private readonly fieldMask =
    "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.photos";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    this.cacheManager = new CacheManager<Place[]>(5 * 60 * 1000, 100, 20); // 5 minutes, max 100 entries, cleanup 20
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
   * Geocode an address or place name to coordinates
   * Returns the single best matching location
   */
  async geocode(input: GeocodeInput): Promise<GeocodeResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY environment variable.",
      );
    }

    const cacheKey = `geocode:${JSON.stringify(input)}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached && cached.length > 0) {
      // Convert cached Place back to GeocodeResult
      const place = cached[0];
      return {
        location: place.location,
        displayName: place.name,
        address: place.address,
        placeId: place.id,
        types: place.types,
        // Note: boundingBox is not available from cached Place data
      };
    }

    try {
      const requestBody: GoogleTextSearchRequestBody = {
        textQuery: input.address,
        maxResultCount: 1,
      };

      // Add region bias if country code is provided
      if (input.countryCode) {
        requestBody.regionCode = input.countryCode.toUpperCase();
      }

      // Use helper with custom field mask to include viewport for bounding box
      const places = await this.makeGooglePlacesRequest(
        "places:searchText",
        requestBody,
        `${this.fieldMask},places.viewport`,
      );

      if (!places || places.length === 0) {
        throw new Error(`No results found for address: ${input.address}`);
      }

      const place = places[0];
      const result = this.transformToGeocodeResult(place);

      // Cache the result (as Place[] for compatibility)
      const placesForCache = this.transformPlaces([place]);
      this.cacheManager.set(cacheKey, placesForCache);

      return result;
    } catch (error) {
      console.error("Google Places geocode error:", error);
      throw error;
    }
  }

  /**
   * Transform Google Place to GeocodeResult
   */
  private transformToGeocodeResult(place: GooglePlace): GeocodeResult {
    const location = place.location || { latitude: 0, longitude: 0 };

    const result: GeocodeResult = {
      location: {
        latitude: location.latitude || 0,
        longitude: location.longitude || 0,
        height: 0,
      },
      displayName: place.displayName?.text || place.name || "Unknown",
      placeId: place.id,
    };

    if (place.formattedAddress) {
      result.address = place.formattedAddress;
    }

    // Add bounding box from viewport if available
    if (place.viewport) {
      result.boundingBox = {
        northeast: {
          latitude: place.viewport.high?.latitude || 0,
          longitude: place.viewport.high?.longitude || 0,
        },
        southwest: {
          latitude: place.viewport.low?.latitude || 0,
          longitude: place.viewport.low?.longitude || 0,
        },
      };
    }

    if (place.types) {
      result.types = place.types;
    }

    return result;
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
    const cached = this.cacheManager.get(cacheKey);
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

      const googlePlaces = await this.makeGooglePlacesRequest(
        "places:searchText",
        requestBody,
      );

      const places = this.transformPlaces(googlePlaces);
      this.cacheManager.set(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Google Places search error:", error);
      throw error;
    }
  }

  /**
   * Make a request to Google Places API
   * Returns raw GooglePlace array for flexible transformation
   */
  private async makeGooglePlacesRequest(
    endpoint: string,
    requestBody: GoogleTextSearchRequestBody | GoogleNearbySearchRequestBody,
    customFieldMask?: string,
  ): Promise<GooglePlace[]> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": customFieldMask || this.fieldMask,
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
    return data.places || [];
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
   * Clear all cached data
   */
  clearCache(): void {
    this.cacheManager.clear();
  }
}
