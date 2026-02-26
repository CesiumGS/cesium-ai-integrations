import { z } from "zod";
import {
  PositionSchema,
  PlaceTypeSchema,
  TravelModeSchema,
} from "./core-schemas.js";

/**
 * Tool input schemas for geolocation operations
 *
 * These schemas define generic interfaces for location search and routing.
 * See PROVIDERS.md for details on available service providers.
 */

/**
 * Geocode input for address-to-coordinates conversion
 * Use for: "What are the coordinates of X?", single landmarks, addresses
 * NOT for: Finding multiple businesses/POIs by category (use SearchInputSchema)
 * Best providers: Nominatim (free), Google (commercial)
 */
export const GeocodeInputSchema = z.object({
  address: z
    .string()
    .min(1)
    .describe(
      "SINGLE address, landmark, or place name to convert to coordinates. " +
        'Examples: "Empire State Building", "Eiffel Tower", "1600 Pennsylvania Avenue", "Tokyo, Japan". ' +
        'Use this for "What are the coordinates of X?" queries. ' +
        "DO NOT use for finding multiple businesses (use geolocation_search instead).",
    ),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe(
      "Optional two-letter country code to restrict search (e.g., 'US', 'GB', 'JP')",
    ),
});

/**
 * Text search input for POI (Point of Interest) search
 * Use for: Finding MULTIPLE businesses/amenities by category or type
 * Supports both general search and location-based (nearby) search
 * NOT for: Single landmarks or "coordinates of X" queries (use GeocodeInputSchema)
 * Best providers: Overpass (free, better POI data), Google (commercial, rich details)
 */
export const SearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Category or TYPE of places to find (e.g., "pizza restaurants", "gyms", "coffee shops", "hotels", "gas stations"). ' +
        "Returns MULTIPLE places. " +
        'DO NOT use for single landmarks like "Empire State Building" - use geolocation_geocode for those.',
    ),
  location: PositionSchema.optional().describe(
    "Center point for location-biased or nearby search. When combined with radius, performs a nearby search.",
  ),
  radius: z
    .number()
    .min(0)
    .max(50000)
    .optional()
    .describe(
      "Search radius in meters (max 50km). When specified with location, restricts results to this distance (nearby search). When omitted, results are biased toward location but not restricted.",
    ),
  types: z
    .array(PlaceTypeSchema)
    .optional()
    .describe(
      "Filter by place types (e.g., restaurant, cafe, hotel, hospital). Supported types vary by data source.",
    ),
  maxResults: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of results to return"),
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
    .describe("Intermediate waypoints for multi-stop routes"),
  travelMode: TravelModeSchema.default("driving").describe(
    "Travel mode: driving, walking, cycling, or transit",
  ),
  alternatives: z
    .boolean()
    .default(false)
    .describe("Return alternative routes when available"),
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
export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;
export type SearchInput = z.infer<typeof SearchInputSchema>;
export type RouteInput = z.infer<typeof RouteInputSchema>;
export type VisualizationOptions = z.infer<typeof VisualizationOptionsSchema>;
