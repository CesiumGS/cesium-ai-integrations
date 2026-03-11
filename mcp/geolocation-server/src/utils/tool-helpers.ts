import type { Place } from "../schemas/index.js";
/**
 * Creates a standard place search response output structure
 * @param success - Whether the operation succeeded
 * @param places - Array of places found
 * @param responseTime - Time taken for the operation in ms
 * @param customMessage - Optional custom message, defaults to standard message
 * @param additionalContext - Optional additional context for error messages
 */
export function createPlacesResponseOutput(
  success: boolean,
  places: Place[],
  responseTime: number,
  customMessage?: string,
  additionalContext?: string,
) {
  if (success) {
    return {
      success: true,
      places,
      message: customMessage ?? `Found ${places.length} place(s)`,
      stats: {
        queryTime: responseTime,
        resultsCount: places.length,
      },
    };
  }

  const baseMessage = customMessage ?? "Search failed";
  const fullMessage = additionalContext
    ? `${baseMessage}: ${additionalContext}`
    : baseMessage;

  return {
    success: false,
    places: [],
    message: fullMessage,
    stats: {
      queryTime: responseTime,
      resultsCount: 0,
    },
  };
}
