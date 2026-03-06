import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddBillboardEntity } from "../../src/tools/entity-add-billboard";

describe("registerAddBillboardEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    position: { longitude: -105.1, latitude: 40.2, height: 0 },
    billboard: { image: "https://example.com/icon.png" },
  };

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn((_name, _config, handler) => {
        registeredHandler = handler;
      }),
    };
    mockCommunicationServer = {
      executeCommand: vi.fn(),
    };

    registerAddBillboardEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_billboard"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_billboard",
      expect.objectContaining({ title: "Add Billboard Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Billboard entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Billboard");
    expect(response.structuredContent.message).toContain("Billboard");
    expect(response.structuredContent.position).toEqual(validArgs.position);
    expect(response.structuredContent.stats?.totalEntities).toBe(1);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.billboard).toEqual(validArgs.billboard);
    expect(command.entity.description).toBeUndefined();
    expect(command.entity.id).toMatch(/^billboard_/);
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({
      ...validArgs,
      name: "Airport Icon",
    });

    expect(response.structuredContent.entityName).toBe("Airport Icon");
    expect(response.structuredContent.message).toContain("Airport Icon");
  });

  it("returns error response when executeCommand throws", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Network error"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain("Network error");
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Failed to add billboard",
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain(
      "Failed to add billboard",
    );
  });

  it("passes scale and color from billboard config", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({
      ...validArgs,
      billboard: {
        image: "https://example.com/icon.png",
        scale: 1.5,
        color: { red: 1, green: 0, blue: 0 },
      },
    });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.billboard.scale).toBe(1.5);
    expect(command.entity.billboard.color).toEqual({
      red: 1,
      green: 0,
      blue: 0,
    });
  });

  it("uses provided id in the entity command", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({ ...validArgs, id: "custom-id-123" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("custom-id-123");
  });

  it("includes description in the entity command when provided", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({
      ...validArgs,
      description: "An airport runway marker",
    });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("An airport runway marker");
  });
});
