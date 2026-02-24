import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  SearchInputSchema,
  SearchResponseSchema,
  type SearchInput,
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
 * Register the geolocation_search tool
 * Searches for places by name or type with optional location bias
 */
export function registerGeolocationSearch(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
  placesProvider: IPlacesProvider,
): void {
  server.registerTool(
    "geolocation_search",
    {
      title: "Search for Places",
      description:
        'Search for places by name or type (e.g., "pizza restaurants", "gyms near me"). ' +
        "Supports location-biased search.",
      inputSchema: SearchInputSchema.shape,
      outputSchema: SearchResponseSchema.shape,
    },
    async (params: SearchInput) => {
      const startTime = Date.now();

      try {
        const places = await placesProvider.searchPlaces(params);
        const responseTime = Date.now() - startTime;

        await sendPlacesToClient(
          communicationServer,
          "geolocation_search",
          places,
        );

        const output = createPlacesResponseOutput(
          true,
          places,
          responseTime,
          `Found ${places.length} place(s)`,
        );

        return buildSuccessResponse(ResponseEmoji.Search, responseTime, output);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const output = createPlacesResponseOutput(
          false,
          [],
          responseTime,
          "Search failed",
          formatErrorMessage(error),
        );

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
