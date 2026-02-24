import type { IPlacesProvider } from "./places-provider.interface.js";
import type { IRoutesProvider } from "./routes-provider.interface.js";
import {
  GooglePlacesProvider,
  GoogleRoutesProvider,
  NominatimPlacesProvider,
  OSRMRoutesProvider,
} from "./providers/index.js";

export type PlacesProviderType = "google" | "nominatim";
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
 * Supports multiple backends: Google, Nominatim, OSRM
 *
 * Environment Variables:
 * - PLACES_PROVIDER: 'google' | 'nominatim' (default: 'google')
 * - ROUTES_PROVIDER: 'google' | 'osrm' (default: 'google')
 * - GOOGLE_MAPS_API_KEY: Required for Google providers
 * - OSRM_SERVER_URL: Optional custom OSRM server URL (default: public demo server)
 */
export class ProviderFactory {
  /**
   * Create a Places provider based on configuration
   */
  static createPlacesProvider(config?: ProviderConfig): IPlacesProvider {
    const providerType =
      config?.placesProvider ||
      (process.env.PLACES_PROVIDER as PlacesProviderType) ||
      "google";

    switch (providerType) {
      case "nominatim":
        return new NominatimPlacesProvider();

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
      "google";

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
    places: { type: PlacesProviderType; providers: IPlacesProvider[] };
    routes: { type: RoutesProviderType; providers: IRoutesProvider[] };
  } {
    const placesProviderType =
      (process.env.PLACES_PROVIDER as PlacesProviderType) || "google";
    const routesProviderType =
      (process.env.ROUTES_PROVIDER as RoutesProviderType) || "google";

    return {
      places: {
        type: placesProviderType,
        providers: [new GooglePlacesProvider(), new NominatimPlacesProvider()],
      },
      routes: {
        type: routesProviderType,
        providers: [new GoogleRoutesProvider(), new OSRMRoutesProvider()],
      },
    };
  }
}
