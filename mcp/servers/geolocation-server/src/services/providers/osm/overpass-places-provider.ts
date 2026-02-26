import "dotenv/config";
import { SearchInput, Place } from "../../../schemas/index.js";
import type { ISearchProvider } from "../../places-provider.interface.js";
import { CacheManager } from "../cache-manager.js";
import { calculateDistance } from "../geospatial-utils.js";
import { getUserAgent, RateLimiter } from "./osm-utils.js";
import type {
  OverpassResponse,
  OverpassElement,
} from "./types/overpass-api-types.js";

/**
 * Overpass API (OpenStreetMap) Places Provider
 * Better POI search capabilities than Nominatim
 *
 * Features:
 * - Direct OpenStreetMap POI queries
 * - Better amenity/POI coverage than Nominatim
 * - Restaurant, cafe, shop, tourism searches
 * - Free and open-source
 *
 * Limitations:
 * - No ratings, reviews, or opening hours
 * - No photos or user-generated content
 * - Public server has rate limits (recommend 2 seconds between requests)
 * - Slower than commercial APIs
 */
export class OverpassPlacesProvider implements ISearchProvider {
  private baseUrl: string;
  private cacheManager: CacheManager<Place[]>;
  private rateLimiter: RateLimiter;
  private userAgent: string;

  constructor(serverUrl?: string) {
    // Use custom server URL if provided, otherwise use public instance
    this.baseUrl =
      serverUrl ||
      process.env.OVERPASS_SERVER_URL ||
      "https://overpass-api.de/api/interpreter";
    this.cacheManager = new CacheManager<Place[]>(5 * 60 * 1000, 100, 20); // 5 minutes, max 100 entries
    this.rateLimiter = new RateLimiter(2000); // 2 seconds between requests (conservative for public server)
    this.userAgent = getUserAgent();

    console.error(`[Overpass] Using server: ${this.baseUrl}`);
  }

  /**
   * Overpass is always available (no API key required)
   */
  isConfigured(): boolean {
    return true;
  }

  getProviderName(): string {
    return "Overpass API (OpenStreetMap)";
  }

  /**
   * Search for places by text query
   * Uses Overpass QL to search for POIs matching the query
   */
  async searchPlaces(input: SearchInput): Promise<Place[]> {
    const cacheKey = `search:${JSON.stringify(input)}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.rateLimiter.wait();

      // Determine search area
      let bbox: string;
      if (input.location && input.radius) {
        // Search within radius around location
        bbox = this.createBoundingBox(
          input.location.latitude,
          input.location.longitude,
          input.radius,
        );
      } else if (input.location) {
        // Default radius of 50km for location-biased search
        bbox = this.createBoundingBox(
          input.location.latitude,
          input.location.longitude,
          50000,
        );
      } else {
        // No location provided, search globally (limited results)
        bbox = "";
      }

      // Build query based on search text
      const query = this.buildSearchQuery(
        input.query,
        bbox,
        input.maxResults || 10,
      );

      let places = await this.fetchAndTransformPlaces(query);

      // Filter by actual distance if location and radius are specified
      if (input.location && input.radius) {
        const beforeFilter = places.length;
        places = places.filter((place) => {
          const distance = calculateDistance(
            input.location!.latitude,
            input.location!.longitude,
            place.location.latitude,
            place.location.longitude,
          );
          return distance <= input.radius!;
        });
        console.error(
          `[Overpass] Distance filter: ${beforeFilter} -> ${places.length} places (radius: ${input.radius}m)`,
        );
      }

      // Sort by distance if location is provided
      if (input.location) {
        places = this.sortByDistance(
          places,
          input.location.latitude,
          input.location.longitude,
        );
      }

      // Limit to requested number of results
      places = places.slice(0, input.maxResults || 10);

      this.cacheManager.set(cacheKey, places);
      return places;
    } catch (error) {
      console.error("Overpass search error:", error);
      throw error;
    }
  }

  /**
   * Build Overpass QL query for text search
   */
  private buildSearchQuery(
    searchText: string,
    bbox: string,
    limit: number,
  ): string {
    // Parse search text to identify POI types
    const lowerSearch = searchText.toLowerCase();
    const amenityTypes = this.extractAmenityTypes(lowerSearch);

    if (amenityTypes.length > 0) {
      // Build query for specific amenity types
      const nodeQueries = amenityTypes
        .map((type) =>
          bbox
            ? `node["${type.key}"="${type.value}"](${bbox});`
            : `node["${type.key}"="${type.value}"];`,
        )
        .join("\n  ");

      const wayQueries = amenityTypes
        .map((type) =>
          bbox
            ? `way["${type.key}"="${type.value}"](${bbox});`
            : `way["${type.key}"="${type.value}"];`,
        )
        .join("\n  ");

      return `[out:json][timeout:25];
(
  ${nodeQueries}
  ${wayQueries}
);
out center ${limit};`;
    }
    // Fallback: search by name containing the search text
    const bboxFilter = bbox ? `(${bbox})` : "";
    return `[out:json][timeout:25];
(
  node["name"~"${this.escapeRegex(searchText)}",i]${bboxFilter};
  way["name"~"${this.escapeRegex(searchText)}",i]${bboxFilter};
);
out center ${limit};`;
  }

  /**
   * Build Overpass QL query for nearby search
   */
  private buildNearbyQuery(
    searchTerms: string[],
    bbox: string,
    limit: number,
  ): string {
    const queries: string[] = [];

    for (const term of searchTerms) {
      if (term === "*") {
        // Search for all amenities
        queries.push(`node["amenity"](${bbox});`);
        queries.push(`way["amenity"](${bbox});`);
      } else {
        const amenityTypes = this.extractAmenityTypes(term);
        if (amenityTypes.length > 0) {
          for (const type of amenityTypes) {
            queries.push(`node["${type.key}"="${type.value}"](${bbox});`);
            queries.push(`way["${type.key}"="${type.value}"](${bbox});`);
          }
        } else {
          // Search by name
          queries.push(`node["name"~"${this.escapeRegex(term)}",i](${bbox});`);
          queries.push(`way["name"~"${this.escapeRegex(term)}",i](${bbox});`);
        }
      }
    }

    return `[out:json][timeout:25];
(
  ${queries.join("\n  ")}
);
out center ${limit};`;
  }

  /**
   * Extract OSM amenity types from search text
   */
  private extractAmenityTypes(
    searchText: string,
  ): Array<{ key: string; value: string }> {
    const types: Array<{ key: string; value: string }> = [];

    // Map common search terms to OSM tags
    const tagMap: Record<string, Array<{ key: string; value: string }>> = {
      restaurant: [{ key: "amenity", value: "restaurant" }],
      cafe: [{ key: "amenity", value: "cafe" }],
      coffee: [{ key: "amenity", value: "cafe" }],
      bar: [{ key: "amenity", value: "bar" }],
      pub: [{ key: "amenity", value: "pub" }],
      gym: [
        { key: "amenity", value: "gym" },
        { key: "leisure", value: "fitness_centre" },
      ],
      fitness: [{ key: "leisure", value: "fitness_centre" }],
      hotel: [{ key: "tourism", value: "hotel" }],
      hostel: [{ key: "tourism", value: "hostel" }],
      hospital: [{ key: "amenity", value: "hospital" }],
      pharmacy: [{ key: "amenity", value: "pharmacy" }],
      bank: [{ key: "amenity", value: "bank" }],
      atm: [{ key: "amenity", value: "atm" }],
      fuel: [{ key: "amenity", value: "fuel" }],
      gas_station: [{ key: "amenity", value: "fuel" }],
      parking: [{ key: "amenity", value: "parking" }],
      mall: [{ key: "shop", value: "mall" }],
      shop: [{ key: "shop", value: "*" }],
      supermarket: [{ key: "shop", value: "supermarket" }],
      museum: [{ key: "tourism", value: "museum" }],
      library: [{ key: "amenity", value: "library" }],
      park: [{ key: "leisure", value: "park" }],
      attraction: [{ key: "tourism", value: "attraction" }],
      airport: [{ key: "aeroway", value: "aerodrome" }],
      station: [{ key: "railway", value: "station" }],
    };

    // Check if search text contains any known types
    for (const [keyword, tags] of Object.entries(tagMap)) {
      if (searchText.includes(keyword)) {
        types.push(...tags);
      }
    }

    return types;
  }

  /**
   * Create bounding box from center point and radius
   */
  private createBoundingBox(
    lat: number,
    lon: number,
    radiusMeters: number,
  ): string {
    const radiusDegrees = radiusMeters / 111000; // rough conversion
    const south = lat - radiusDegrees;
    const west = lon - radiusDegrees;
    const north = lat + radiusDegrees;
    const east = lon + radiusDegrees;
    return `${south},${west},${north},${east}`;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Fetch and transform places from Overpass API
   */
  private async fetchAndTransformPlaces(query: string): Promise<Place[]> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(
        `Overpass API error: ${response.status} - ${response.statusText}`,
      );
    }

    const data = (await response.json()) as OverpassResponse;
    console.error(`[Overpass] Raw results: ${data.elements.length} elements`);
    return this.transformPlaces(data.elements);
  }

  /**
   * Transform Overpass elements to Place schema
   */
  private transformPlaces(elements: OverpassElement[]): Place[] {
    return elements
      .map((element) => {
        // Get coordinates (nodes have lat/lon, ways have center)
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;

        if (!lat || !lon) {
          return null; // Skip elements without coordinates
        }

        const tags = element.tags || {};
        const name = tags.name || "Unnamed";

        // Build address from tags
        const addressParts: string[] = [];
        if (tags["addr:housenumber"]) {
          addressParts.push(tags["addr:housenumber"]);
        }
        if (tags["addr:street"]) {
          addressParts.push(tags["addr:street"]);
        }
        if (tags["addr:city"]) {
          addressParts.push(tags["addr:city"]);
        }
        if (tags["addr:postcode"]) {
          addressParts.push(tags["addr:postcode"]);
        }
        const address =
          addressParts.length > 0 ? addressParts.join(", ") : undefined;

        // Determine types from tags
        const types: string[] = [];
        if (tags.amenity) {
          types.push(tags.amenity);
        }
        if (tags.shop) {
          types.push(tags.shop);
        }
        if (tags.tourism) {
          types.push(tags.tourism);
        }
        if (tags.leisure) {
          types.push(tags.leisure);
        }

        const place: Place = {
          id: `${element.type}/${element.id}`,
          name,
          location: {
            latitude: lat,
            longitude: lon,
            height: 0,
          },
        };

        if (address) {
          place.address = address;
        }

        if (types.length > 0) {
          place.types = types;
        }

        return place;
      })
      .filter((place): place is Place => place !== null);
  }

  /**
   * Sort places by distance from a point
   */
  private sortByDistance(places: Place[], lat: number, lon: number): Place[] {
    return places.sort((a, b) => {
      const distA = calculateDistance(
        lat,
        lon,
        a.location.latitude,
        a.location.longitude,
      );
      const distB = calculateDistance(
        lat,
        lon,
        b.location.latitude,
        b.location.longitude,
      );
      return distA - distB;
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cacheManager.clear();
  }
}
