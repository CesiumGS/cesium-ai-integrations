import { SearchInput, NearbySearchInput, Place } from "src/schemas/index.js";

/**
 * Interface for place search providers
 * Implementations: Google Places API, Nominatim
 */
export interface IPlacesProvider {
  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Search for places by text query
   * @param input Search parameters
   * @returns Array of matching places
   */
  searchPlaces(input: SearchInput): Promise<Place[]>;

  /**
   * Search for places near a location
   * @param input Nearby search parameters
   * @returns Array of nearby places
   */
  searchNearby(input: NearbySearchInput): Promise<Place[]>;

  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;

  /**
   * Clear any cached data
   */
  clearCache(): void;
}
