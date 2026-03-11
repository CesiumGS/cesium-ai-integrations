/**
 * Cache management utilities for providers
 */
import type { CacheEntry } from "./shared-types.js";

/**
 * Generic cache manager for providers
 */
export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private cacheDuration: number;
  private maxCacheSize: number;
  private cleanupSize: number;

  constructor(
    cacheDuration: number = 5 * 60 * 1000, // 5 minutes default
    maxCacheSize: number = 100,
    cleanupSize: number = 20,
  ) {
    this.cacheDuration = cacheDuration;
    this.maxCacheSize = maxCacheSize;
    this.cleanupSize = cleanupSize;
  }

  /**
   * Get data from cache if not expired
   */
  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set data in cache with automatic cleanup
   */
  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean old entries if cache grows too large
    if (this.cache.size > this.maxCacheSize) {
      const oldestKeys = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.cleanupSize)
        .map(([key]) => key);

      oldestKeys.forEach((key) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
}
