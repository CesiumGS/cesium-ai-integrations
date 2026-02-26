import type {
  IGeocodeProvider,
  ISearchProvider,
} from "./places-provider.interface.js";
import type { IRoutesProvider } from "./routes-provider.interface.js";
import {
  GooglePlacesProvider,
  GoogleRoutesProvider,
  NominatimPlacesProvider,
  OverpassPlacesProvider,
  OSRMRoutesProvider,
} from "./providers/index.js";

export type PlacesProviderType = "google" | "nominatim" | "overpass" | "osm";
export type RoutesProviderType = "google" | "osrm";

/**
 * Configuration for geolocation providers
 */
export interface ProviderConfig {
  placesProvider?: PlacesProviderType;
  routesProvider?: RoutesProviderType;
  googleApiKey?: string;
  osrmServerUrl?: string;
}

/**
 * Factory for creating geolocation service providers
 * Supports multiple backends: Google, Nominatim, Overpass, OSRM
 *
 * Environment Variables:
 * - PLACES_PROVIDER: 'google' | 'nominatim' | 'overpass' | 'osm' (default: 'osm')
 * - ROUTES_PROVIDER: 'google' | 'osrm' (default: 'osrm')
 * - GOOGLE_MAPS_API_KEY: Required for Google providers
 * - OVERPASS_SERVER_URL: Optional custom Overpass server URL
 * - OSRM_SERVER_URL: Optional custom OSRM server URL (default: public demo server)
 *
 * Provider Recommendations:
 * - 'osm': Uses Nominatim for geocoding + Overpass for POI searches (recommended)
 * - 'nominatim': Uses Nominatim for geocoding + Overpass for POI searches (same as 'osm')
 * - 'overpass': Uses Nominatim for geocoding + Overpass for POI searches (same as 'osm')
 * - 'google': Full-featured but requires API key (uses Google for both)
 *
 * Note: Nominatim only supports geocoding, Overpass only supports POI search.
 * When you select either, the factory automatically provides the complementary OSM service.
 */
export class ProviderFactory {
  /**
   * Create a Geocode provider based on configuration
   * Returns provider for address-to-coordinates conversion
   */
  static createGeocodeProvider(config?: ProviderConfig): IGeocodeProvider {
    const providerType =
      config?.placesProvider ||
      (process.env.PLACES_PROVIDER as PlacesProviderType) ||
      "osm";

    switch (providerType) {
      case "osm":
      case "nominatim":
      case "overpass":
        // OSM providers: use Nominatim for geocoding
        return new NominatimPlacesProvider();

      case "google":
      default:
        return new GooglePlacesProvider(config?.googleApiKey);
    }
  }

  /**
   * Create a Search provider based on configuration
   * Returns provider for POI (Point of Interest) searches
   */
  static createSearchProvider(config?: ProviderConfig): ISearchProvider {
    const providerType =
      config?.placesProvider ||
      (process.env.PLACES_PROVIDER as PlacesProviderType) ||
      "osm";

    switch (providerType) {
      case "osm":
      case "nominatim":
      case "overpass":
        // OSM providers: use Overpass for POI searches
        return new OverpassPlacesProvider();

      case "google":
      default:
        return new GooglePlacesProvider(config?.googleApiKey);
    }
  }

  /**
   * Create a Routes provider based on configuration
   */
  static createRoutesProvider(config?: ProviderConfig): IRoutesProvider {
    const providerType =
      config?.routesProvider ||
      (process.env.ROUTES_PROVIDER as RoutesProviderType) ||
      "osrm";

    switch (providerType) {
      case "osrm":
        return new OSRMRoutesProvider(config?.osrmServerUrl);

      case "google":
      default:
        return new GoogleRoutesProvider(config?.googleApiKey);
    }
  }

  /**
   * Get information about available providers
   */
  static getProviderInfo(): {
    places: {
      type: PlacesProviderType;
      geocodeProviders: IGeocodeProvider[];
      searchProviders: ISearchProvider[];
    };
    routes: { type: RoutesProviderType; providers: IRoutesProvider[] };
  } {
    const placesProviderType =
      (process.env.PLACES_PROVIDER as PlacesProviderType) || "osm";
    const routesProviderType =
      (process.env.ROUTES_PROVIDER as RoutesProviderType) || "osrm";

    return {
      places: {
        type: placesProviderType,
        geocodeProviders: [
          new GooglePlacesProvider(),
          new NominatimPlacesProvider(),
        ],
        searchProviders: [
          new GooglePlacesProvider(),
          new OverpassPlacesProvider(),
        ],
      },
      routes: {
        type: routesProviderType,
        providers: [new GoogleRoutesProvider(), new OSRMRoutesProvider()],
      },
    };
  }
}
