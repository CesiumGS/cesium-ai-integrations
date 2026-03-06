import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { RemoveEntityResponse } from "../../src/schemas/index";
import { registerRemoveEntity } from "../../src/tools/entity-remove";

describe("registerRemoveEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: RemoveEntityResponse;
    isError: boolean;
  }>;

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn((_name, _config, handler) => {
        registeredHandler = handler;
      }),
    };
    mockCommunicationServer = {
      executeCommand: vi.fn(),
    };

    registerRemoveEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_remove"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_remove",
      expect.objectContaining({ title: "Remove Entity" }),
      expect.any(Function),
    );
  });

  it("handles entity removal by entityId", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      removedEntityId: "point_001",
      removedCount: 1,
    });

    const response = await registeredHandler({ entityId: "point_001" });

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("point_001");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.removedEntityId).toBe("point_001");
    expect(response.structuredContent.removedCount).toBe(1);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({
      type: "entity_remove",
      entityId: "point_001",
    });
  });

  it("handles entity removal by namePattern with removeAll", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      removedCount: 5,
    });

    const response = await registeredHandler({
      namePattern: "Point.*",
      removeAll: true,
    });

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("5");
    expect(response.structuredContent.message).toContain("Point.*");

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({
      type: "entity_remove",
      namePattern: "Point.*",
      removeAll: true,
    });
  });

  it("throws error when neither entityId nor namePattern is provided", async () => {
    const response = await registeredHandler({});

    expect(response.structuredContent.success).toBe(false);
    expect(response.structuredContent.message).toContain(
      "entityId or namePattern",
    );
    expect(response.isError).toBe(true);
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Command failed"),
    );

    const response = await registeredHandler({ entityId: "e1" });

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain("Failed");
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Entity not found",
    });

    const response = await registeredHandler({ entityId: "missing-entity" });

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
  });

  it("defaults confirmRemoval to true", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      removedCount: 1,
    });

    await registeredHandler({ entityId: "e1" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({ confirmRemoval: true });
  });
});
