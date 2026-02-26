import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UserLocationResponseSchema } from "../schemas/index.js";
import { USER_INTERACTION_TIMEOUT_MS } from "../utils/constants.js";
import {
  ICommunicationServer,
  ResponseEmoji,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  executeWithTiming,
} from "@cesium-mcp/shared";

/**
 * Register the geolocation_get_user_location tool
 * Requests the user's current GPS location from the browser
 */
export function registerGeolocationGetUserLocation(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "geolocation_get_user_location",
    {
      title: "Get User Location",
      description:
        "Request the user's current location from the browser (requires user permission). " +
        'Useful for "near me" queries.',
      inputSchema: z.object({}).shape,
      outputSchema: UserLocationResponseSchema.shape,
    },
    async () => {
      try {
        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          { type: "geolocation_get_user_location" },
          USER_INTERACTION_TIMEOUT_MS,
        );

        const resultData = result as Record<string, unknown>;

        if (resultData["success"] && resultData["location"]) {
          const loc = resultData["location"] as {
            latitude: number;
            longitude: number;
          };
          const accuracy = resultData["accuracy"] as number | undefined;

          const output = {
            success: true,
            location: loc,
            message: `Location acquired — Lat: ${loc.latitude.toFixed(6)}, Lon: ${loc.longitude.toFixed(6)}${accuracy ? ` (±${accuracy.toFixed(0)}m)` : ""}`,
            accuracy: accuracy ?? null,
            timestamp: Date.now(),
          };

          return buildSuccessResponse(
            ResponseEmoji.Location,
            responseTime,
            output,
          );
        }

        throw new Error(
          (resultData["error"] as string | undefined) ??
            "Failed to get location",
        );
      } catch (error) {
        const responseTime = 0;
        const output = {
          success: false,
          message:
            `Location request failed: ${formatErrorMessage(error)}. ` +
            "Make sure to grant location permission in your browser.",
          timestamp: Date.now(),
        };

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
