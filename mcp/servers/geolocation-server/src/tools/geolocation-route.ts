import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { RoutesService } from "../services/routes-service.js";
import {
  type RouteInput,
  RouteInputSchema,
  RouteResponseSchema,
} from "../schemas/index.js";
import { formatDuration, formatDistance } from "../utils/utils.js";

/**
 * Register geolocation_route tool
 */
export function registerGeolocationRoute(
  server: McpServer,
  communicationServer: ICommunicationServer,
  routesService: RoutesService,
): void {
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
}
