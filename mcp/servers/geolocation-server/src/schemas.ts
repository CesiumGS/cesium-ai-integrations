import { z } from "zod";

// Common schemas
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

// Search schemas
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

// Route schemas
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

// Response schemas
export const PlaceSchema = z.object({
  id: z.string().describe("Place ID"),
  name: z.string().describe("Place name"),
  address: z.string().optional().describe("Formatted address"),
  location: PositionSchema.describe("Geographic location"),
  types: z.array(z.string()).optional().describe("Place types"),
  rating: z.number().optional().describe("Rating (0-5)"),
  userRatingsTotal: z.number().optional().describe("Number of ratings"),
  priceLevel: z.number().optional().describe("Price level (0-4)"),
  openNow: z.boolean().optional().describe("Currently open"),
  photos: z.array(z.string()).optional().describe("Photo URLs"),
  vicinity: z.string().optional().describe("Simplified address"),
});

export const RouteSchema = z.object({
  summary: z.string().describe("Route summary"),
  distance: z.number().describe("Total distance in meters"),
  duration: z.number().describe("Estimated duration in seconds"),
  polyline: z.string().describe("Encoded polyline geometry"),
  bounds: z
    .object({
      northeast: PositionSchema,
      southwest: PositionSchema,
    })
    .describe("Route bounding box"),
  legs: z
    .array(
      z.object({
        distance: z.number(),
        duration: z.number(),
        startLocation: PositionSchema,
        endLocation: PositionSchema,
        steps: z
          .array(
            z.object({
              instruction: z.string(),
              distance: z.number(),
              duration: z.number(),
            }),
          )
          .optional(),
      }),
    )
    .describe("Route legs"),
  warnings: z.array(z.string()).optional().describe("Route warnings"),
  trafficInfo: z
    .object({
      durationInTraffic: z.number().optional(),
      congestionLevel: z.string().optional(),
    })
    .optional(),
});

export const SearchResponseSchema = z.object({
  success: z.boolean(),
  places: z.array(PlaceSchema),
  message: z.string(),
  cached: z.boolean().optional(),
  stats: z.object({
    queryTime: z.number(),
    resultsCount: z.number(),
  }),
});

export const RouteResponseSchema = z.object({
  success: z.boolean(),
  routes: z.array(RouteSchema),
  message: z.string(),
  cached: z.boolean().optional(),
  stats: z.object({
    queryTime: z.number(),
    routesCount: z.number(),
  }),
});

export const UserLocationResponseSchema = z.object({
  success: z.boolean(),
  location: PositionSchema.optional(),
  message: z.string(),
  accuracy: z.number().optional().describe("Location accuracy in meters"),
  timestamp: z
    .number()
    .optional()
    .describe("Timestamp of location acquisition"),
});

// Export types
export type Position = z.infer<typeof PositionSchema>;
export type PlaceType = z.infer<typeof PlaceTypeSchema>;
export type TravelMode = z.infer<typeof TravelModeSchema>;
export type SearchInput = z.infer<typeof SearchInputSchema>;
export type NearbySearchInput = z.infer<typeof NearbySearchInputSchema>;
export type RouteInput = z.infer<typeof RouteInputSchema>;
export type VisualizationOptions = z.infer<typeof VisualizationOptionsSchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type RouteResponse = z.infer<typeof RouteResponseSchema>;
export type UserLocationResponse = z.infer<typeof UserLocationResponseSchema>;
