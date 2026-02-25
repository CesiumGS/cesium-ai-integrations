import { z } from "zod";

export const PositionSchema = z.object({
  longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
  latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
  height: z
    .number()
    .optional()
    .describe("Height above ellipsoid in meters (default: 0)"),
});

export const PlaceTypeSchema = z
  .enum([
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
  ])
  .describe("Type of place to search for");

export const TravelModeSchema = z
  .enum(["driving", "walking", "cycling", "transit"])
  .describe("Travel mode for routing");

// Export types
export type Position = z.infer<typeof PositionSchema>;
export type PlaceType = z.infer<typeof PlaceTypeSchema>;
export type TravelMode = z.infer<typeof TravelModeSchema>;
