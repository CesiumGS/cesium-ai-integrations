import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResponseEmoji, RESPONSE_EMOJIS } from "../../../src/utils/constants";
import type { ICommunicationServer } from "../../../src/communications/communication-server";
import type { CommandInput, CommandResult } from "../../../src/types/types";
import {
  buildErrorResponse,
  buildSuccessResponse,
  executeWithTiming,
  formatErrorMessage,
} from "../../../build/utils/utils";

// ---------------------------------------------------------------------------
describe("formatErrorMessage", () => {
  it("returns error.message for an Error instance", () => {
    expect(formatErrorMessage(new Error("something went wrong"))).toBe(
      "something went wrong",
    );
  });

  it("returns error.message for a subclass of Error", () => {
    expect(formatErrorMessage(new TypeError("bad type"))).toBe("bad type");
  });

  it('returns "Unknown error" for null', () => {
    expect(formatErrorMessage(null)).toBe("Unknown error");
  });

  it('returns "Unknown error" for undefined', () => {
    expect(formatErrorMessage(undefined)).toBe("Unknown error");
  });

  it('returns "Unknown error" for a plain string', () => {
    expect(formatErrorMessage("raw string error")).toBe("Unknown error");
  });

  it('returns "Unknown error" for a plain object with a message property', () => {
    expect(formatErrorMessage({ message: "not an error" })).toBe(
      "Unknown error",
    );
  });

  it('returns "Unknown error" for a number', () => {
    expect(formatErrorMessage(42)).toBe("Unknown error");
  });
});

// ---------------------------------------------------------------------------
describe("buildSuccessResponse", () => {
  const content = { message: "Entity added", id: "abc" };

  it("returns isError: false", () => {
    const result = buildSuccessResponse(ResponseEmoji.Success, 50, content);
    expect(result.isError).toBe(false);
  });

  it("passes structuredContent through unchanged", () => {
    const result = buildSuccessResponse(ResponseEmoji.Point, 100, content);
    expect(result.structuredContent).toBe(content);
  });

  it("uses the correct emoji for the given ResponseEmoji key", () => {
    const result = buildSuccessResponse(ResponseEmoji.Point, 100, content);
    const expectedEmoji = RESPONSE_EMOJIS[ResponseEmoji.Point];
    expect(result.content[0].text).toContain(expectedEmoji);
  });

  it("includes the message in the text content", () => {
    const result = buildSuccessResponse(ResponseEmoji.Success, 75, content);
    expect(result.content[0].text).toContain(content.message);
  });

  it('includes the responseTime in the text with "(Xms)" format', () => {
    const result = buildSuccessResponse(ResponseEmoji.Success, 123, content);
    expect(result.content[0].text).toContain("(123ms)");
  });

  it("content array has exactly one text entry", () => {
    const result = buildSuccessResponse(ResponseEmoji.Success, 0, content);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
  });
});

// ---------------------------------------------------------------------------
describe("buildErrorResponse", () => {
  const content = { message: "Something failed", code: 500 };

  it("returns isError: true", () => {
    const result = buildErrorResponse(50, content);
    expect(result.isError).toBe(true);
  });

  it("passes structuredContent through unchanged", () => {
    const result = buildErrorResponse(50, content);
    expect(result.structuredContent).toBe(content);
  });

  it("uses the Error emoji (❌)", () => {
    const result = buildErrorResponse(50, content);
    expect(result.content[0].text).toContain(
      RESPONSE_EMOJIS[ResponseEmoji.Error],
    );
  });

  it("includes the message in the text content", () => {
    const result = buildErrorResponse(200, content);
    expect(result.content[0].text).toContain(content.message);
  });

  it('includes the responseTime with "(Xms)" format', () => {
    const result = buildErrorResponse(77, content);
    expect(result.content[0].text).toContain("(77ms)");
  });
});

// ---------------------------------------------------------------------------
describe("executeWithTiming", () => {
  let mockCommunicationServer: ICommunicationServer;
  const command: CommandInput = { type: "test_command", param: "value" };
  const mockResult: CommandResult = { success: true, data: "ok" };

  beforeEach(() => {
    mockCommunicationServer = {
      executeCommand: vi.fn().mockResolvedValue(mockResult),
      start: vi.fn(),
      stop: vi.fn(),
      getStats: vi.fn(),
    } as unknown as ICommunicationServer;
  });

  it("calls executeCommand with the provided command", async () => {
    await executeWithTiming(mockCommunicationServer, command);
    expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
      command,
      undefined,
    );
  });

  it("forwards timeoutMs to executeCommand", async () => {
    await executeWithTiming(mockCommunicationServer, command, 5000);
    expect(mockCommunicationServer.executeCommand).toHaveBeenCalledWith(
      command,
      5000,
    );
  });

  it("returns the result from executeCommand", async () => {
    const { result } = await executeWithTiming(
      mockCommunicationServer,
      command,
    );
    expect(result).toEqual(mockResult);
  });

  it("returns a non-negative responseTime", async () => {
    const { responseTime } = await executeWithTiming(
      mockCommunicationServer,
      command,
    );
    expect(responseTime).toBeGreaterThanOrEqual(0);
  });

  it("measures elapsed time — responseTime increases with artificial delay", async () => {
    vi.mocked(mockCommunicationServer.executeCommand).mockImplementation(
      () => new Promise((r) => setTimeout(() => r(mockResult), 20)),
    );
    const { responseTime } = await executeWithTiming(
      mockCommunicationServer,
      command,
    );
    expect(responseTime).toBeGreaterThanOrEqual(10); // generous lower bound
  });

  it("propagates rejections from executeCommand", async () => {
    const err = new Error("network failure");
    vi.mocked(mockCommunicationServer.executeCommand).mockRejectedValue(err);
    await expect(
      executeWithTiming(mockCommunicationServer, command),
    ).rejects.toThrow("network failure");
  });
});
