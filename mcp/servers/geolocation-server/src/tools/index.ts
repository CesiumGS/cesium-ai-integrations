import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { ProviderFactory } from "../services/provider-factory.js";
import { registerGeolocationGeocode } from "./geolocation-geocode.js";
import { registerGeolocationSearch } from "./geolocation-search.js";
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
  const geocodeProvider = ProviderFactory.createGeocodeProvider();
  const searchProvider = ProviderFactory.createSearchProvider();
  const routesProvider = ProviderFactory.createRoutesProvider();

  // Print provider info
  console.error(`📍 Geocode provider: ${geocodeProvider.getProviderName()}`);
  console.error(`🔍 Search provider: ${searchProvider.getProviderName()}`);
  console.error(`🗺️  Routes provider: ${routesProvider.getProviderName()}`);

  // Register places tools (geocoding and search)
  registerGeolocationGeocode(server, communicationServer, geocodeProvider);
  registerGeolocationSearch(server, communicationServer, searchProvider);

  // Register route tool
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
