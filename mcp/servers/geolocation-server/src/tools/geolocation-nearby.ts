import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  NearbySearchInputSchema,
  SearchResponseSchema,
  type NearbySearchInput,
} from "../schemas/index.js";
import type { IPlacesProvider } from "../services/places-provider.interface.js";
import {
  ICommunicationServer,
  ResponseEmoji,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "@cesium-mcp/shared";
import {
  createPlacesResponseOutput,
  sendPlacesToClient,
} from "src/utils/tool-helpers.js";

/**
 * Register the geolocation_nearby tool
 * Finds places within a radius of a specific location
 */
export function registerGeolocationNearby(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
  placesProvider: IPlacesProvider,
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
        const places = await placesProvider.searchNearby(params);
        const responseTime = Date.now() - startTime;

        await sendPlacesToClient(
          communicationServer,
          "geolocation_nearby",
          places,
        );

        const output = createPlacesResponseOutput(
          true,
          places,
          responseTime,
          `Found ${places.length} place(s) within ${params.radius ?? 5000}m`,
        );

        return buildSuccessResponse(ResponseEmoji.Search, responseTime, output);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const output = createPlacesResponseOutput(
          false,
          [],
          responseTime,
          "Nearby search failed",
          formatErrorMessage(error),
        );

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
