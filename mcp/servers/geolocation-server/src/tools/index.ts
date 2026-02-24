import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { ProviderFactory } from "../services/provider-factory.js";
import { registerGeolocationSearch } from "./geolocation-search.js";
import { registerGeolocationNearby } from "./geolocation-nearby.js";
import { registerGeolocationRoute } from "./geolocation-route.js";
import { registerGeolocationGetUserLocation } from "./geolocation-get-user-location.js";

/**
 * Register all geolocation tools with the MCP server
 * @param server              - The MCP server instance
 * @param communicationServer - The communication server for browser interaction (optional)
 *                              If not provided, visualization is disabled but search/route tools still work
 */
export function registerGeolocationTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  // Create provider instances based on configuration
  const placesProvider = ProviderFactory.createPlacesProvider();
  const routesProvider = ProviderFactory.createRoutesProvider();

  // Print provider info
  console.log(`📍 Places provider: ${placesProvider.getProviderName()}`);
  console.log(`🗺️  Routes provider: ${routesProvider.getProviderName()}`);

  // Register tools that can work with or without visualization
  registerGeolocationSearch(server, communicationServer, placesProvider);
  registerGeolocationNearby(server, communicationServer, placesProvider);
  registerGeolocationRoute(server, communicationServer, routesProvider);

  // Register browser-dependent tool only if communicationServer is available
  let toolCount = 3;
  if (communicationServer) {
    registerGeolocationGetUserLocation(server, communicationServer);
    toolCount = 4;
  } else {
    console.warn(
      "⚠️  geolocation_get_user_location not registered (requires communicationServer)",
    );
  }

  if (!communicationServer) {
    console.warn("⚠️  Running in standalone mode (no CesiumJS visualization)");
  }

  console.error(`✅ Registered ${toolCount} geolocation tool(s)`);
}
