import { z } from "zod";
import {
  PositionSchema,
  PlaceTypeSchema,
  TravelModeSchema,
} from "./core-schemas.js";

/**
 * Tool input schemas for geolocation operations
 *
 * Provider-specific parameters are documented to indicate support levels.
 * See PROVIDERS.md for detailed provider capabilities.
 */

/**
 * Text search input for places
 */
export const SearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Search query (e.g., "pizza restaurants", "gyms near me")'),
  location: PositionSchema.optional().describe(
    "Center point for location-biased search",
  ),
  radius: z
    .number()
    .min(0)
    .max(50000)
    .optional()
    .describe("Search radius in meters (max 50km, support varies by provider)"),
  types: z
    .array(PlaceTypeSchema)
    .optional()
    .describe("Filter by place types (support varies by provider)"),
  maxResults: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of results"),
});

/**
 * Nearby places search input
 */
export const NearbySearchInputSchema = z.object({
  location: PositionSchema.describe("Center point for nearby search"),
  radius: z
    .number()
    .min(0)
    .max(50000)
    .default(5000)
    .describe("Search radius in meters (default 5km)"),
  types: z
    .array(PlaceTypeSchema)
    .optional()
    .describe("Filter by place types (support varies by provider)"),
  keyword: z
    .string()
    .optional()
    .describe('Keyword to filter results (e.g., "organic")'),
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe(
      "Minimum rating (0-5) - Provider-specific: Supported by Google, ignored by OSM/Nominatim",
    ),
  openNow: z
    .boolean()
    .optional()
    .describe(
      "Only return places open now - Provider-specific: Supported by Google, ignored by OSM/Nominatim",
    ),
  maxResults: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of results"),
});

/**
 * Route computation input
 */
export const RouteInputSchema = z.object({
  origin: PositionSchema.describe("Starting location"),
  destination: PositionSchema.describe("Ending location"),
  waypoints: z
    .array(PositionSchema)
    .optional()
    .describe("Intermediate waypoints"),
  travelMode: TravelModeSchema.default("driving").describe(
    "Travel mode (support varies by provider)",
  ),
  avoidTolls: z
    .boolean()
    .optional()
    .describe("Avoid toll roads - Provider-specific: Google only"),
  avoidHighways: z
    .boolean()
    .optional()
    .describe("Avoid highways - Provider-specific: Google only"),
  avoidFerries: z
    .boolean()
    .optional()
    .describe("Avoid ferries - Provider-specific: Google only"),
  departureTime: z
    .string()
    .optional()
    .describe(
      "Departure time in ISO 8601 format - Provider-specific: Google only",
    ),
  trafficModel: z
    .enum(["best_guess", "pessimistic", "optimistic"])
    .optional()
    .describe("Traffic prediction model - Provider-specific: Google only"),
  alternatives: z
    .boolean()
    .default(false)
    .describe("Return alternative routes"),
});

/**
 * Visualization display options for routes and places
 */
export const VisualizationOptionsSchema = z.object({
  showMarkers: z.boolean().default(true).describe("Show markers at waypoints"),
  showLabels: z.boolean().default(true).describe("Show labels on markers"),
  routeColor: z
    .string()
    .optional()
    .describe("Route polyline color (CSS color or hex)"),
  routeWidth: z
    .number()
    .min(1)
    .max(20)
    .default(5)
    .describe("Route line width in pixels"),
  drawCorridor: z
    .boolean()
    .default(false)
    .describe("Draw route as polygon corridor"),
  flyToRoute: z
    .boolean()
    .default(true)
    .describe("Automatically fly camera to view route"),
});

// Export inferred types
export type SearchInput = z.infer<typeof SearchInputSchema>;
export type NearbySearchInput = z.infer<typeof NearbySearchInputSchema>;
export type RouteInput = z.infer<typeof RouteInputSchema>;
export type VisualizationOptions = z.infer<typeof VisualizationOptionsSchema>;
