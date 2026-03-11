/**
 * User-Agent configuration and validation utilities for OSM services
 *
 * Nominatim usage policy requires a valid User-Agent with contact information
 * See: https://operations.osmfoundation.org/policies/nominatim/
 */

/**
 * Get and validate User-Agent from environment variable
 *
 * @param serviceName Name of the service (e.g., "Nominatim", "OSRM")
 * @param defaultUserAgent Default User-Agent if not configured
 * @returns User-Agent string
 */
export function getUserAgent(): string {
  const userAgent = process.env.OSM_USER_AGENT || "";

  if (!process.env.OSM_USER_AGENT) {
    console.warn(
      `⚠️  WARNING: OSM_USER_AGENT not configured. Using default User-Agent.\n` +
        `   According to Nominatim's usage policy, you should provide a unique User-Agent\n` +
        `   with contact information. Example: OSM_USER_AGENT="MyApp/1.0 (contact@example.com)"\n` +
        `   See: https://operations.osmfoundation.org/policies/nominatim/`,
    );
  } else if (!userAgent.includes("@") && !userAgent.includes("http")) {
    console.warn(
      `⚠️  WARNING: OSM_USER_AGENT should include contact information (email or website).\n` +
        `   Example: OSM_USER_AGENT="MyApp/1.0 (contact@example.com)"\n` +
        `   See: https://operations.osmfoundation.org/policies/nominatim/`,
    );
  }

  return userAgent;
}

/**
 * Rate limiter for API requests
 * Useful for respecting API rate limits (e.g., Nominatim's 1 req/sec limit)
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private minRequestInterval: number;

  /**
   * @param minRequestInterval Minimum time between requests in milliseconds
   */
  constructor(minRequestInterval: number = 1100) {
    this.minRequestInterval = minRequestInterval;
  }

  /**
   * Wait if necessary to respect rate limit
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.lastRequestTime = 0;
  }
}
