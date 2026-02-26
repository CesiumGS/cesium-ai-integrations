import { SearchInput, GeocodeInput, Place } from "../schemas/index.js";

/**
 * Geocode result (address to coordinates conversion)
 */
export interface GeocodeResult {
  location: {
    latitude: number;
    longitude: number;
    height?: number;
  };
  displayName: string;
  address?: string;
  boundingBox?: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  };
  placeId?: string;
  types?: string[];
}

/**
 * Interface for geocoding providers (address to coordinates)
 * Implementations: Nominatim, Google Places API
 */
export interface IGeocodeProvider {
  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Geocode an address or place name to coordinates
   * Returns a single best matching location
   * @param input Geocode parameters
   * @returns Best matching location
   */
  geocode(input: GeocodeInput): Promise<GeocodeResult>;

  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;

  /**
   * Clear any cached data
   */
  clearCache(): void;
}

/**
 * Interface for POI search providers (places of interest)
 * Implementations: Overpass API, Google Places API
 */
export interface ISearchProvider {
  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Search for places by text query (POI search)
   * Returns multiple matching places
   * Supports general search, location-biased search, and nearby search
   * (when both location and radius are provided)
   * @param input Search parameters
   * @returns Array of matching places
   */
  searchPlaces(input: SearchInput): Promise<Place[]>;

  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;

  /**
   * Clear any cached data
   */
  clearCache(): void;
}

/**
 * Combined interface for providers that support both geocoding and search
 * Implementation: Google Places API
 */
export interface IPlacesProvider extends IGeocodeProvider, ISearchProvider {}
