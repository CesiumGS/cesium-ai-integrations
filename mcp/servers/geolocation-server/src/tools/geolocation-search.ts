import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  SearchInputSchema,
  SearchResponseSchema,
  type SearchInput,
} from "../schemas/index.js";
import type { ISearchProvider } from "../services/places-provider.interface.js";
import {
  ICommunicationServer,
  ResponseEmoji,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "@cesium-mcp/shared";
import {
  createPlacesResponseOutput,
  sendPlacesToClient,
} from "../utils/tool-helpers.js";

/**
 * Register the geolocation_search tool
 * Searches for POIs (Points of Interest) by type or category
 * Returns multiple matching places (not just one location)
 *
 * Best providers:
 * - Overpass: Free, excellent for POI searches (restaurants, cafes, shops, etc.)
 * - Google: Commercial, includes ratings, reviews, photos, hours
 *
 * NOT for:
 * - Address geocoding: Use geolocation_geocode instead
 * - Single location lookup: Use geolocation_geocode instead
 */
export function registerGeolocationSearch(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
  placesProvider: ISearchProvider,
): void {
  server.registerTool(
    "geolocation_search",
    {
      title: "Search for Points of Interest (POIs)",
      description:
        'Search for MULTIPLE POIs by category or business type (e.g., "pizza restaurants", "gyms", "coffee shops", "hotels", "gas stations"). ' +
        "Use this for finding businesses and amenities, NOT for single landmarks. " +
        "Returns MULTIPLE matching places. " +
        'Supports both general search and location-based (nearby) search - use location + radius parameters for nearby searches like "gyms near Golden Gate Bridge". ' +
        'DO NOT use for "What are the coordinates of Empire State Building" or similar landmark queries - use geolocation_geocode instead. ' +
        "Supports location-biased search, radius filtering, and type filtering.",
      inputSchema: SearchInputSchema.shape,
      outputSchema: SearchResponseSchema.shape,
    },
    async (params: SearchInput) => {
      const startTime = Date.now();

      try {
        const places = await placesProvider.searchPlaces(params);
        const responseTime = Date.now() - startTime;

        await sendPlacesToClient(
          communicationServer,
          "geolocation_search",
          places,
        );

        // Build message with place names (limit to first 10 to avoid overly long messages)
        let message = `Found ${places.length} place(s)`;
        if (places.length > 0) {
          const placeNames = places.slice(0, 10).map((p) => p.name);
          const namesList = placeNames.join(", ");
          if (places.length > 10) {
            message += `: ${namesList}, and ${places.length - 10} more`;
          } else {
            message += `: ${namesList}`;
          }
        }

        const output = createPlacesResponseOutput(
          true,
          places,
          responseTime,
          message,
        );

        return buildSuccessResponse(ResponseEmoji.Search, responseTime, output);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const output = createPlacesResponseOutput(
          false,
          [],
          responseTime,
          "Search failed",
          formatErrorMessage(error),
        );

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
