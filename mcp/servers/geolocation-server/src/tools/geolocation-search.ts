import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { PlacesService } from "../services/places-service.js";
import {
  type SearchInput,
  SearchInputSchema,
  SearchResponseSchema,
} from "../schemas/index.js";

/**
 * Register geolocation_search tool
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
        'Search for places by name or type (e.g., "pizza restaurants", "gyms near me"). Supports location-biased search.',
      inputSchema: SearchInputSchema.shape,
      outputSchema: SearchResponseSchema.shape,
    },
    async (params) => {
      const startTime = Date.now();

      try {
        const places = await placesService.searchPlaces(params as SearchInput);
        const responseTime = Date.now() - startTime;

        // Send visualization command to browser
        if (places.length > 0) {
          await communicationServer.executeCommand({
            type: "geolocation_search",
            places: places.map((p) => ({
              id: p.id,
              name: p.name,
              location: p.location,
              rating: p.rating,
              types: p.types,
            })),
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ Found ${places.length} place(s) (${responseTime}ms)\n\n${places
                .map(
                  (p, i) =>
                    `${i + 1}. ${p.name}${p.rating ? ` ⭐${p.rating}` : ""}` +
                    `${p.address ? `\n   📍 ${p.address}` : ""}` +
                    `\n   🗺️  Coordinates: ${p.location.latitude.toFixed(6)}, ${p.location.longitude.toFixed(6)}`,
                )
                .join("\n\n")}`,
            },
          ],
          structuredContent: {
            success: true,
            places,
            message: `Found ${places.length} places`,
            stats: {
              queryTime: responseTime,
              resultsCount: places.length,
            },
          },
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            { type: "text", text: `❌ Search failed: ${errorMessage}` },
          ],
          structuredContent: {
            success: false,
            places: [],
            message: errorMessage,
            stats: { queryTime: Date.now() - startTime, resultsCount: 0 },
          },
          isError: true,
        };
      }
    },
  );
}
