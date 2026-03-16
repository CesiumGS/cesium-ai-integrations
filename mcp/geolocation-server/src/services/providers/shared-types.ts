/**
 * Shared types used across multiple providers
 */

/**
 * Cache entry with timestamp for expiration tracking
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

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
