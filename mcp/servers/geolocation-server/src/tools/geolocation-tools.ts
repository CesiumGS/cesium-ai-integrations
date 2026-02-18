import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { PlacesService } from "../services/places-service.js";
import { RoutesService } from "../services/routes-service.js";
import {
  type SearchInput,
  type NearbySearchInput,
  type RouteInput,
  SearchInputSchema,
  NearbySearchInputSchema,
  RouteInputSchema,
  SearchResponseSchema,
  RouteResponseSchema,
  UserLocationResponseSchema,
} from "../schemas.js";

/**
 * Register all geolocation-related tools with the MCP server
 */
export function registerGeolocationTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Geolocation tools require a communication server for browser visualization",
    );
  }

  const placesService = new PlacesService();
  const routesService = new RoutesService();

  // Tool: geolocation_search
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

  // Tool: geolocation_nearby
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

  // Tool: geolocation_route
  server.registerTool(
    "geolocation_route",
    {
      title: "Compute Route",
      description:
        "Calculate optimal route between two locations with support for multiple travel modes (driving, walking, cycling, transit) and traffic awareness.",
      inputSchema: RouteInputSchema.shape,
      outputSchema: RouteResponseSchema.shape,
    },
    async (params) => {
      const startTime = Date.now();

      try {
        const routes = await routesService.computeRoute(params as RouteInput);
        const responseTime = Date.now() - startTime;

        // Send visualization command to browser with default options
        // If multiple routes (alternatives), keep previous ones for comparison
        const clearPrevious = routes.length === 1;

        if (routes.length > 0) {
          for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const positions = RoutesService.decodePolyline(route.polyline);
            const isPrimary = i === 0;

            await communicationServer.executeCommand({
              type: "geolocation_route",
              route: {
                positions,
                summary: route.summary,
                distance: route.distance,
                duration: route.duration,
                travelMode: (params as RouteInput).travelMode || "driving",
              },
              options: {
                showMarkers: isPrimary, // Only show markers on primary route
                showLabels: isPrimary,
                routeWidth: isPrimary ? 5 : 3, // Thinner lines for alternatives
                drawCorridor: false,
                flyToRoute: isPrimary, // Only fly to primary route
                clearPrevious: i === 0 && clearPrevious, // Only clear on first route if single route
              },
            });
          }
        }

        const formatDuration = (seconds: number) => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          if (hours > 0) {
            return `${hours}h ${minutes}m`;
          }
          return `${minutes}m`;
        };

        const formatDistance = (meters: number) => {
          if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
          }
          return `${meters.toFixed(0)} m`;
        };

        const responsePayload = {
          content: [
            {
              type: "text" as const,
              text: `✅ Found ${routes.length} route(s) (${responseTime}ms)\n\n${routes
                .map((r, i) => {
                  const coordinates = RoutesService.decodePolyline(r.polyline);
                  return (
                    `${i === 0 ? "🔵 Best Route" : `Route ${i + 1}`}: ${r.summary}\n` +
                    `   📏 Distance: ${formatDistance(r.distance)}\n` +
                    `   ⏱️  Duration: ${formatDuration(r.duration)}${r.trafficInfo?.durationInTraffic ? ` (with traffic: ${formatDuration(r.trafficInfo.durationInTraffic)})` : ""}\n` +
                    `   🛣️  Legs: ${r.legs.length}${r.warnings ? `\n   ⚠️  ${r.warnings.join(", ")}` : ""}\n` +
                    `   📍 Coordinates (${coordinates.length} points):\n` +
                    `\`\`\`json\n${JSON.stringify(
                      coordinates.map((c) => [
                        c.longitude,
                        c.latitude,
                        c.height || 0,
                      ]),
                      null,
                      2,
                    )}\n\`\`\``
                  );
                })
                .join("\n\n")}`,
            },
          ],
          structuredContent: {
            success: true,
            routes, // Full raw route objects with all details (legs, steps, polyline, bounds, etc.)
            message: `Found ${routes.length} route(s)`,
            stats: {
              queryTime: responseTime,
              routesCount: routes.length,
            },
            // For animation compatibility: also expose the primary route with travel mode
            primaryRoute:
              routes.length > 0
                ? {
                    ...routes[0],
                    travelMode: (params as RouteInput).travelMode || "driving",
                  }
                : undefined,
          },
        };

        return responsePayload;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `❌ Route calculation failed: ${errorMessage}`,
            },
          ],
          structuredContent: {
            success: false,
            routes: [],
            message: errorMessage,
            stats: { queryTime: Date.now() - startTime, routesCount: 0 },
          },
          isError: true,
        };
      }
    },
  );

  // Tool: geolocation_get_user_location
  server.registerTool(
    "geolocation_get_user_location",
    {
      title: "Get User Location",
      description:
        'Request the user\'s current location from the browser (requires user permission). Useful for "near me" queries.',
      inputSchema: {},
      outputSchema: UserLocationResponseSchema.shape,
    },
    async () => {
      try {
        const result = await communicationServer.executeCommand(
          {
            type: "geolocation_get_user_location",
          },
          15000,
        ); // 15 second timeout for user interaction

        if (result.success && result.location) {
          return {
            content: [
              {
                type: "text",
                text:
                  `✅ User location acquired\n` +
                  `📍 Lat: ${result.location.latitude.toFixed(6)}, Lon: ${result.location.longitude.toFixed(6)}\n` +
                  `🎯 Accuracy: ${result.accuracy ? `±${result.accuracy.toFixed(0)}m` : "Unknown"}`,
              },
            ],
            structuredContent: {
              success: true,
              location: result.location,
              message: "Location acquired",
              accuracy: result.accuracy,
              timestamp: Date.now(),
            },
          };
        }

        throw new Error(result.error || "Failed to get location");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `❌ Location request failed: ${errorMessage}\n\n💡 Make sure to grant location permission in your browser`,
            },
          ],
          structuredContent: {
            success: false,
            message: errorMessage,
            timestamp: Date.now(),
          },
          isError: true,
        };
      }
    },
  );

  console.error("✅ Registered 4 geolocation tools");
}
