import { z } from "zod";
import { PositionSchema } from "./core-schemas.js";

/**
 * Response schemas for geolocation operations
 *
 * These schemas define generic response formats for location and routing data.
 * Some fields may not be available from all data sources.
 * See PROVIDERS.md for details on specific provider capabilities.
 */

/**
 * Standard statistics included in all responses
 */
export const ResponseStatsSchema = z.object({
  queryTime: z.number().describe("Operation time in milliseconds"),
  resultsCount: z.number().optional().describe("Number of results returned"),
  routesCount: z.number().optional().describe("Number of routes returned"),
});

/**
 * A single place result
 */
export const PlaceSchema = z.object({
  id: z
    .string()
    .describe("Unique place identifier (format varies by data source)"),
  name: z.string().describe("Place name or primary display name"),
  address: z.string().optional().describe("Formatted address"),
  location: PositionSchema.describe("Geographic location (WGS84 coordinates)"),
  types: z
    .array(z.string())
    .optional()
    .describe("Place types or categories (e.g., cafe, restaurant, hotel)"),
  rating: z
    .number()
    .optional()
    .describe("User rating (0-5). May not be available from all data sources."),
  userRatingsTotal: z
    .number()
    .optional()
    .describe(
      "Number of user ratings. May not be available from all data sources.",
    ),
  priceLevel: z
    .number()
    .optional()
    .describe(
      "Price level (0-4, from free to very expensive). May not be available from all data sources.",
    ),
  openNow: z
    .boolean()
    .optional()
    .describe(
      "Whether place is currently open. May not be available from all data sources.",
    ),
  photos: z
    .array(z.string())
    .optional()
    .describe(
      "Photo URLs or references. May not be available from all data sources.",
    ),
  vicinity: z.string().optional().describe("Simplified address for display"),
});

/**
 * A single route result
 */
export const RouteSchema = z.object({
  summary: z
    .string()
    .describe("Route summary with key road names or description"),
  distance: z.number().describe("Total distance in meters"),
  duration: z
    .number()
    .describe("Estimated duration in seconds based on typical travel speeds"),
  polyline: z
    .string()
    .describe("Encoded polyline geometry for route visualization"),
  bounds: z
    .object({
      northeast: PositionSchema,
      southwest: PositionSchema,
    })
    .describe("Route bounding box (northeast and southwest corners)"),
  legs: z
    .array(
      z.object({
        distance: z.number().describe("Leg distance in meters"),
        duration: z.number().describe("Leg duration in seconds"),
        startLocation: PositionSchema,
        endLocation: PositionSchema,
        steps: z
          .array(
            z.object({
              instruction: z
                .string()
                .describe("Turn-by-turn navigation instruction"),
              distance: z.number().describe("Step distance in meters"),
              duration: z.number().describe("Step duration in seconds"),
            }),
          )
          .optional()
          .describe("Turn-by-turn navigation steps with detailed instructions"),
      }),
    )
    .describe(
      "Route legs (segments between waypoints). One leg for simple point-to-point routes, multiple legs for routes with intermediate stops.",
    ),
  warnings: z
    .array(z.string())
    .optional()
    .describe(
      "Route warnings or notices (e.g., road conditions, restrictions)",
    ),
  trafficInfo: z
    .object({
      durationInTraffic: z
        .number()
        .optional()
        .describe("Duration considering real-time traffic in seconds"),
      congestionLevel: z
        .string()
        .optional()
        .describe("Traffic congestion level description"),
    })
    .optional()
    .describe(
      "Real-time traffic information. May not be available from all routing services.",
    ),
});

/**
 * Response for geocoding operations (address to coordinates)
 */
export const GeocodeResponseSchema = z.object({
  success: z.boolean().describe("Operation success status"),
  location: PositionSchema.optional().describe("Geocoded location"),
  displayName: z
    .string()
    .optional()
    .describe("Formatted display name for the location"),
  address: z.string().optional().describe("Formatted address of the location"),
  boundingBox: z
    .object({
      northeast: PositionSchema,
      southwest: PositionSchema,
    })
    .optional()
    .describe("Bounding box of the geocoded location"),
  message: z.string().describe("Human-readable result message"),
  cached: z.boolean().optional(),
  stats: ResponseStatsSchema,
});

/**
 * Response for place search operations (POI search)
 */
export const SearchResponseSchema = z.object({
  success: z.boolean().describe("Operation success status"),
  places: z.array(PlaceSchema),
  message: z.string().describe("Human-readable result message"),
  cached: z.boolean().optional(),
  stats: ResponseStatsSchema,
});

/**
 * Response for route computation operations
 */
export const RouteResponseSchema = z.object({
  success: z.boolean().describe("Operation success status"),
  routes: z.array(RouteSchema),
  message: z.string().describe("Human-readable result message"),
  cached: z.boolean().optional(),
  stats: ResponseStatsSchema,
});

/**
 * Response for user location requests
 */
export const UserLocationResponseSchema = z.object({
  success: z.boolean().describe("Operation success status"),
  location: PositionSchema.optional(),
  message: z.string().describe("Human-readable result message"),
  accuracy: z.number().optional().describe("Location accuracy in meters"),
  timestamp: z
    .number()
    .optional()
    .describe("Timestamp of location acquisition"),
});

// Export inferred types
export type ResponseStats = z.infer<typeof ResponseStatsSchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type RouteResponse = z.infer<typeof RouteResponseSchema>;
export type UserLocationResponse = z.infer<typeof UserLocationResponseSchema>;
