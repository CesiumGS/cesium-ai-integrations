import { ICommunicationServer } from "../communications/communication-server.js";
import { CommandInput, CommandResult } from "../types/types.js";
import { RESPONSE_EMOJIS, ResponseEmoji } from "./constants.js";

/**
 * Formats error messages consistently
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Executes a command with timing measurement
 */
export async function executeWithTiming<
  T extends CommandResult = CommandResult,
>(
  communicationServer: ICommunicationServer,
  command: CommandInput,
  timeoutMs?: number,
): Promise<{ result: T; responseTime: number }> {
  const startTime = Date.now();
  const result = (await communicationServer.executeCommand(
    command,
    timeoutMs,
  )) as T;
  const responseTime = Date.now() - startTime;
  return { result, responseTime };
}

/**
 * Builds an error response structure (raw version with string emoji)
 */
function buildResponse<T extends { message: string }>(
  errorEmoji: string,
  responseTime: number,
  structuredContent: T,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${errorEmoji} ${structuredContent.message} (${responseTime}ms)`,
      },
    ],
    structuredContent,
    isError: true,
  };
}

/**
 * Builds a success response structure with emoji mapping
 */
export function buildSuccessResponse<T extends { message: string }>(
  emoji: ResponseEmoji,
  responseTime: number,
  structuredContent: T,
) {
  return buildResponse(RESPONSE_EMOJIS[emoji], responseTime, structuredContent);
}

/**
 * Builds an error response structure with emoji mapping
 */
export function buildErrorResponse<T extends { message: string }>(
  responseTime: number,
  structuredContent: T,
) {
  return buildResponse(
    RESPONSE_EMOJIS[ResponseEmoji.Error],
    responseTime,
    structuredContent,
  );
}
