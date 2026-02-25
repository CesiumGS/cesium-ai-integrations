import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { PlacesService } from "../services/places-service.js";
import {
  type NearbySearchInput,
  NearbySearchInputSchema,
  SearchResponseSchema,
} from "../schemas/index.js";

/**
 * Register geolocation_nearby tool
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
        "Find places within a radius of a specific location. Supports filtering by type, rating, and open status.",
      inputSchema: NearbySearchInputSchema.shape,
      outputSchema: SearchResponseSchema.shape,
    },
    async (params) => {
      const startTime = Date.now();

      try {
        const places = await placesService.searchNearby(
          params as NearbySearchInput,
        );
        const responseTime = Date.now() - startTime;

        // Send visualization command to browser
        if (places.length > 0) {
          await communicationServer.executeCommand({
            type: "geolocation_nearby",
            places: places.map((p) => ({
              id: p.id,
              name: p.name,
              location: p.location,
              rating: p.rating,
              types: p.types,
            })),
          });
        }

        const radius = (params as NearbySearchInput).radius || 5000;
        return {
          content: [
            {
              type: "text",
              text: `✅ Found ${places.length} place(s) within ${radius}m (${responseTime}ms)\n\n${places
                .map(
                  (p, i) =>
                    `${i + 1}. ${p.name}${p.rating ? ` ⭐${p.rating}` : ""}${p.openNow !== undefined ? (p.openNow ? " 🟢 Open" : " 🔴 Closed") : ""}${p.vicinity ? `\n   📍 ${p.vicinity}` : ""}`,
                )
                .join("\n\n")}`,
            },
          ],
          structuredContent: {
            success: true,
            places,
            message: `Found ${places.length} places nearby`,
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
            { type: "text", text: `❌ Nearby search failed: ${errorMessage}` },
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
