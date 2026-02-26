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
