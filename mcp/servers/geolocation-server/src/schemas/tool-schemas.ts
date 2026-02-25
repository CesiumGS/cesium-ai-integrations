import { z } from "zod";
import {
  PositionSchema,
  PlaceTypeSchema,
  TravelModeSchema,
} from "./core-schemas.js";

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
    .describe("Search radius in meters (max 50km)"),
  types: z.array(PlaceTypeSchema).optional().describe("Filter by place types"),
  maxResults: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of results"),
});

export const NearbySearchInputSchema = z.object({
  location: PositionSchema.describe("Center point for nearby search"),
  radius: z
    .number()
    .min(0)
    .max(50000)
    .default(5000)
    .describe("Search radius in meters (default 5km)"),
  types: z.array(PlaceTypeSchema).optional().describe("Filter by place types"),
  keyword: z
    .string()
    .optional()
    .describe('Keyword to filter results (e.g., "organic")'),
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe("Minimum rating (0-5)"),
  openNow: z.boolean().optional().describe("Only return places open now"),
  maxResults: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of results"),
});

export const RouteInputSchema = z.object({
  origin: PositionSchema.describe("Starting location"),
  destination: PositionSchema.describe("Ending location"),
  waypoints: z
    .array(PositionSchema)
    .optional()
    .describe("Intermediate waypoints"),
  travelMode: TravelModeSchema.default("driving").describe("Travel mode"),
  avoidTolls: z.boolean().optional().describe("Avoid toll roads"),
  avoidHighways: z.boolean().optional().describe("Avoid highways"),
  avoidFerries: z.boolean().optional().describe("Avoid ferries"),
  departureTime: z
    .string()
    .optional()
    .describe("Departure time in ISO 8601 format"),
  trafficModel: z
    .enum(["best_guess", "pessimistic", "optimistic"])
    .optional()
    .describe("Traffic prediction model"),
  alternatives: z
    .boolean()
    .default(false)
    .describe("Return alternative routes"),
});

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

// Export types
export type SearchInput = z.infer<typeof SearchInputSchema>;
export type NearbySearchInput = z.infer<typeof NearbySearchInputSchema>;
export type RouteInput = z.infer<typeof RouteInputSchema>;
export type VisualizationOptions = z.infer<typeof VisualizationOptionsSchema>;
