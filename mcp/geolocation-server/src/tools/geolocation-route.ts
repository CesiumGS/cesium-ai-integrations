import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  RouteInputSchema,
  RouteResponseSchema,
  type RouteInput,
} from "../schemas/index.js";
import type { OSRMRoutesProvider } from "../services/providers/osm/osrm-routes-provider.js";
import {
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "../utils/response-utils.js";
import { formatDistance, formatDuration } from "../utils/utils.js";

/**
 * Register the geolocation_route tool
 * Computes optimal routes between two locations
 */
export function registerGeolocationRoute(
  server: McpServer,
  routesProvider: OSRMRoutesProvider,
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
        const routes = await routesProvider.computeRoute(params);
        const responseTime = Date.now() - startTime;

        const routeSummaries = routes
          .map((r, i) => {
            const label = i === 0 ? "🔵 Best Route" : `Route ${i + 1}`;
            const traffic = r.trafficInfo?.durationInTraffic
              ? ` (with traffic: ${formatDuration(r.trafficInfo.durationInTraffic)})`
              : "";
            const warnings = r.warnings
              ? `\n   ⚠️  ${r.warnings.join(", ")}`
              : "";
            return `${label}: ${r.summary}\n   📏 Distance: ${formatDistance(r.distance)}\n   ⏱️  Duration: ${formatDuration(r.duration)}${traffic}\n   🛣️  Legs: ${r.legs.length}${warnings}`;
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
