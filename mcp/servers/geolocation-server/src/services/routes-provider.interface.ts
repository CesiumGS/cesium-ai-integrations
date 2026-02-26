import { Position, Route, RouteInput } from "../schemas/index.js";

/**
 * Interface for routing providers
 * Implementations: Google Routes API, OSRM
 */
export interface IRoutesProvider {
  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Compute routes between origin and destination
   * @param input Route computation parameters
   * @returns Array of computed routes
   */
  computeRoute(input: RouteInput): Promise<Route[]>;

  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;

  /**
   * Clear any cached data
   */
  clearCache(): void;

  /**
   * Decode polyline string to coordinates
   * @param encoded Encoded polyline string
   * @returns Array of positions
   */
  decodePolyline(encoded: string): Position[];
}
