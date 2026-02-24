import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import {
  SearchInputSchema,
  SearchResponseSchema,
  type SearchInput,
} from "../schemas/index.js";
import { PlacesService } from "../services/places-service.js";
import {
  ResponseEmoji,
  TIMEOUT_BUFFER_MS,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "@cesium-mcp/shared";

/**
 * Register the geolocation_search tool
 * Searches for places by name or type with optional location bias
 */
export function registerGeolocationSearch(
  server: McpServer,
  communicationServer: ICommunicationServer,
  placesService: PlacesService,
): void {
  server.registerTool(
    "geolocation_search",
    {
      title: "Search for Places",
      description:
        'Search for places by name or type (e.g., "pizza restaurants", "gyms near me"). ' +
        "Supports location-biased search.",
      inputSchema: SearchInputSchema.shape,
      outputSchema: SearchResponseSchema.shape,
    },
    async (params: SearchInput) => {
      const startTime = Date.now();

      try {
        const places = await placesService.searchPlaces(params);
        const responseTime = Date.now() - startTime;

        if (places.length > 0) {
          await communicationServer.executeCommand(
            {
              type: "geolocation_search",
              places: places.map((p) => ({
                id: p.id,
                name: p.name,
                location: p.location,
                rating: p.rating,
                types: p.types,
              })),
            },
            TIMEOUT_BUFFER_MS,
          );
        }

        const output = {
          success: true,
          places,
          message: `Found ${places.length} place(s)`,
          stats: {
            queryTime: responseTime,
            resultsCount: places.length,
          },
        };

        return buildSuccessResponse(ResponseEmoji.Search, responseTime, output);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const output = {
          success: false,
          places: [],
          message: `Search failed: ${formatErrorMessage(error)}`,
          stats: { queryTime: responseTime, resultsCount: 0 },
        };

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
