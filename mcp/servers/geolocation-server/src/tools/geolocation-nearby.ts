import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import {
  NearbySearchInputSchema,
  SearchResponseSchema,
  type NearbySearchInput,
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
 * Register the geolocation_nearby tool
 * Finds places within a radius of a specific location
 */
export function registerGeolocationNearby(
  server: McpServer,
  communicationServer: ICommunicationServer,
  placesService: PlacesService,
): void {
  server.registerTool(
    "geolocation_nearby",
    {
      title: "Search Nearby Places",
      description:
        "Find places within a radius of a specific location. " +
        "Supports filtering by type, rating, and open status.",
      inputSchema: NearbySearchInputSchema.shape,
      outputSchema: SearchResponseSchema.shape,
    },
    async (params: NearbySearchInput) => {
      const startTime = Date.now();

      try {
        const places = await placesService.searchNearby(params);
        const responseTime = Date.now() - startTime;

        if (places.length > 0) {
          await communicationServer.executeCommand(
            {
              type: "geolocation_nearby",
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
          message: `Found ${places.length} place(s) within ${params.radius ?? 5000}m`,
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
          message: `Nearby search failed: ${formatErrorMessage(error)}`,
          stats: { queryTime: responseTime, resultsCount: 0 },
        };

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
