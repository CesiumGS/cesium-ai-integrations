import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  RouteInputSchema,
  RouteResponseSchema,
  type RouteInput,
} from "../schemas/index.js";
import { RoutesService } from "../services/routes-service.js";
import {
  ICommunicationServer,
  executeWithTiming,
  TIMEOUT_BUFFER_MS,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import { formatDistance, formatDuration } from "src/utils/utils.js";

/**
 * Register the geolocation_route tool
 * Computes optimal routes between two locations
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
        "Calculate optimal route between two locations with support for multiple travel modes " +
        "(driving, walking, cycling, transit) and traffic awareness.",
      inputSchema: RouteInputSchema.shape,
      outputSchema: RouteResponseSchema.shape,
    },
    async (params: RouteInput) => {
      const startTime = Date.now();

      try {
        const routes = await routesService.computeRoute(params);
        const responseTime = Date.now() - startTime;

        // Send each route to the browser, marking the first as primary
        for (let i = 0; i < routes.length; i++) {
          const route = routes[i];
          const positions = RoutesService.decodePolyline(route.polyline);
          const isPrimary = i === 0;

          await communicationServer.executeCommand(
            {
              type: "geolocation_route",
              route: {
                positions,
                summary: route.summary,
                distance: route.distance,
                duration: route.duration,
                travelMode: params.travelMode ?? "driving",
              },
              options: {
                showMarkers: isPrimary,
                showLabels: isPrimary,
                routeWidth: isPrimary ? 5 : 3,
                drawCorridor: false,
                flyToRoute: isPrimary,
                clearPrevious: i === 0 && routes.length === 1,
              },
            },
            TIMEOUT_BUFFER_MS,
          );
        }

        const routeSummaries = routes
          .map((r, i) => {
            const label = i === 0 ? "🔵 Best Route" : `Route ${i + 1}`;
            const traffic = r.trafficInfo?.durationInTraffic
              ? ` (with traffic: ${formatDuration(r.trafficInfo.durationInTraffic)})`
              : "";
            return (
              `${label}: ${r.summary}\n` +
              `   📏 Distance: ${formatDistance(r.distance)}\n` +
              `   ⏱️  Duration: ${formatDuration(r.duration)}${traffic}\n` +
              `   🛣️  Legs: ${r.legs.length}` +
              (r.warnings ? `\n   ⚠️  ${r.warnings.join(", ")}` : "")
            );
          })
          .join("\n\n");

        const output = {
          success: true,
          routes,
          message: `Found ${routes.length} route(s)\n\n${routeSummaries}`,
          stats: {
            queryTime: responseTime,
            routesCount: routes.length,
          },
        };

        return buildSuccessResponse(ResponseEmoji.Route, responseTime, output);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const output = {
          success: false,
          routes: [],
          message: `Route calculation failed: ${formatErrorMessage(error)}`,
          stats: { queryTime: responseTime, routesCount: 0 },
        };

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
