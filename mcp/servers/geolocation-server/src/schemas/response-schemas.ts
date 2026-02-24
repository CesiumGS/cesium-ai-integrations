import { z } from "zod";
import { PositionSchema } from "./core-schemas.js";

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

/**
 * A single route result
 */
export const RouteSchema = z.object({
  summary: z.string().describe("Route summary"),
  distance: z.number().describe("Total distance in meters"),
  duration: z.number().describe("Estimated duration in seconds"),
  polyline: z.string().describe("Encoded polyline geometry"),
  bounds: z.object({
    northeast: PositionSchema,
    southwest: PositionSchema,
  }).describe("Route bounding box"),
  legs: z.array(z.object({
    distance: z.number(),
    duration: z.number(),
    startLocation: PositionSchema,
    endLocation: PositionSchema,
    steps: z.array(z.object({
      instruction: z.string(),
      distance: z.number(),
      duration: z.number(),
    })).optional(),
  })).describe("Route legs"),
  warnings: z.array(z.string()).optional().describe("Route warnings"),
  trafficInfo: z.object({
    durationInTraffic: z.number().optional(),
    congestionLevel: z.string().optional(),
  }).optional(),
});

/**
 * Response for place search operations
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
  timestamp: z.number().optional().describe("Timestamp of location acquisition"),
});

// Export inferred types
export type ResponseStats = z.infer<typeof ResponseStatsSchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type RouteResponse = z.infer<typeof RouteResponseSchema>;
export type UserLocationResponse = z.infer<typeof UserLocationResponseSchema>;
