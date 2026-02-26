import "dotenv/config";
import { GeocodeInput } from "../../../schemas/index.js";
import type {
  IGeocodeProvider,
  GeocodeResult,
} from "../../places-provider.interface.js";
import { CacheManager } from "../cache-manager.js";
import { getUserAgent, RateLimiter } from "./osm-utils.js";
import type { NominatimPlace } from "./types/nominatim-api-types.js";

/**
 * Nominatim (OpenStreetMap) Places Provider
 * Free geocoding and location search service
 *
 * Features:
 * - Geocoding and address search
 * - Points of interest search
 * - OpenStreetMap data coverage
 * - Rate limit: 1 request/second for free tier
 */
export class NominatimPlacesProvider implements IGeocodeProvider {
  private baseUrl = "https://nominatim.openstreetmap.org";
  private geocodeCache: CacheManager<GeocodeResult>;
  private rateLimiter: RateLimiter;
  private userAgent: string;

  constructor() {
    this.geocodeCache = new CacheManager<GeocodeResult>(5 * 60 * 1000, 100, 20); // 5 minutes, max 100 entries, cleanup 20
    this.rateLimiter = new RateLimiter(1100); // 1.1 seconds between requests
    this.userAgent = getUserAgent();
  }

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
   * Geocode an address or place name to coordinates
   * Returns the single best matching location
   */
  async geocode(input: GeocodeInput): Promise<GeocodeResult> {
    const cacheKey = `geocode:${JSON.stringify(input)}`;
    const cached = this.geocodeCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.rateLimiter.wait();

      const params = new URLSearchParams({
        q: input.address,
        format: "json",
        addressdetails: "1",
        limit: "1", // Only need the best match
        extratags: "1",
        namedetails: "1",
      });

      if (input.countryCode) {
        params.append("countrycodes", input.countryCode.toLowerCase());
      }

      const url = `${this.baseUrl}/search?${params.toString()}`;
      console.error(`[Nominatim] Geocoding: ${input.address}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as NominatimPlace[];

      if (!data || data.length === 0) {
        throw new Error(`No results found for address: ${input.address}`);
      }

      const result = this.transformToGeocodeResult(data[0]);

      // Cache the result
      this.geocodeCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Nominatim geocode error:", error);
      throw error;
    }
  }

  /**
   * Transform Nominatim place to GeocodeResult
   */
  private transformToGeocodeResult(place: NominatimPlace): GeocodeResult {
    const result: GeocodeResult = {
      location: {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        height: 0,
      },
      displayName: place.display_name,
      placeId: place.place_id ? String(place.place_id) : undefined,
    };

    // Add address if available
    if (place.address) {
      const parts: string[] = [];
      if (place.address.house_number) {
        parts.push(place.address.house_number);
      }
      if (place.address.road) {
        parts.push(place.address.road);
      }
      if (place.address.city || place.address.town || place.address.village) {
        parts.push(
          place.address.city || place.address.town || place.address.village!,
        );
      }
      if (place.address.state) {
        parts.push(place.address.state);
      }
      if (place.address.postcode) {
        parts.push(place.address.postcode);
      }
      if (place.address.country) {
        parts.push(place.address.country);
      }

      if (parts.length > 0) {
        result.address = parts.join(", ");
      }
    }

    // Add bounding box if available
    if (place.boundingbox && place.boundingbox.length === 4) {
      result.boundingBox = {
        southwest: {
          latitude: parseFloat(place.boundingbox[0]),
          longitude: parseFloat(place.boundingbox[2]),
        },
        northeast: {
          latitude: parseFloat(place.boundingbox[1]),
          longitude: parseFloat(place.boundingbox[3]),
        },
      };
    }

    // Add types if available
    if (place.type || place.class) {
      result.types = [place.type || place.class].filter((t): t is string =>
        Boolean(t),
      );
    }

    return result;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.geocodeCache.clear();
  }
}
