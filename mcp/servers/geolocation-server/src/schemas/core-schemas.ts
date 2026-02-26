import { z } from "zod";

/**
 * Core schemas for geolocation services
 *
 * These schemas are provider-agnostic and define common data structures
 * for geographic positions, place types, and travel modes.
 * See PROVIDERS.md for details on available service providers.
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
 * Common place types supported across different data sources
 */
export const CommonPlaceTypes = [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "gym",
  "hotel",
  "hospital",
  "pharmacy",
  "bank",
  "atm",
  "fuel",
  "parking",
  "mall",
  "shop",
  "museum",
  "library",
  "park",
  "attraction",
  "airport",
  "station",
] as const;

/**
 * Place type schema - accepts any string to support various taxonomies
 */
export const PlaceTypeSchema = z
  .string()
  .min(1)
  .describe(
    "Type of place to search for (e.g., restaurant, cafe, hotel, hospital, fuel, bank, pharmacy, museum, library, park)",
  );

/**
 * Supported travel modes for routing
 */
export const TravelModeSchema = z
  .enum(["driving", "walking", "cycling", "transit"])
  .describe("Travel mode for routing");

// Export inferred types
export type Position = z.infer<typeof PositionSchema>;
export type PlaceType = z.infer<typeof PlaceTypeSchema>;
export type TravelMode = z.infer<typeof TravelModeSchema>;
export type CommonPlaceType = (typeof CommonPlaceTypes)[number];
