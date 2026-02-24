import { z } from "zod";

/**
 * Core schemas for geolocation services
 *
 * These schemas are provider-agnostic, supporting multiple geocoding and routing
 * services (Google, OSM/Nominatim, OSRM, etc.). See PROVIDERS.md for details.
 */

/**
 * Geographic position (WGS84)
 */
export const PositionSchema = z.object({
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude in degrees (-180 to 180)"),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Latitude in degrees (-90 to 90)"),
  height: z
    .number()
    .optional()
    .describe("Height above ellipsoid in meters (default: 0)"),
});

/**
 * Common place types - providers may support different subsets or additional types
 */
export const CommonPlaceTypes = [
  "restaurant",
  "cafe",
  "bar",
  "gym",
  "hotel",
  "hospital",
  "pharmacy",
  "bank",
  "atm",
  "gas_station",
  "parking",
  "shopping_mall",
  "store",
  "museum",
  "library",
  "park",
  "tourist_attraction",
  "airport",
  "transit_station",
] as const;

/**
 * Place type schema - accepts any string to support provider-specific types
 * (e.g., Google's detailed taxonomy, OSM amenity types)
 */
export const PlaceTypeSchema = z
  .string()
  .min(1)
  .describe(
    "Type of place to search for (e.g., restaurant, cafe, hotel). Supported types vary by provider.",
  );

/**
 * Supported travel modes for routing (support varies by provider)
 */
export const TravelModeSchema = z
  .enum(["driving", "walking", "cycling", "transit"])
  .describe("Travel mode for routing");

// Export inferred types
export type Position = z.infer<typeof PositionSchema>;
export type PlaceType = z.infer<typeof PlaceTypeSchema>;
export type TravelMode = z.infer<typeof TravelModeSchema>;
export type CommonPlaceType = (typeof CommonPlaceTypes)[number];
