import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddPolygonEntity } from "../../src/tools/entity-add-polygon";

describe("registerAddPolygonEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    polygon: {
      hierarchy: [
        { longitude: -105.0, latitude: 40.0, height: 0 },
        { longitude: -104.0, latitude: 40.0, height: 0 },
        { longitude: -104.0, latitude: 41.0, height: 0 },
        { longitude: -105.0, latitude: 41.0, height: 0 },
      ],
    },
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

    registerAddPolygonEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_polygon"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_polygon",
      expect.objectContaining({ title: "Add Polygon Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 8,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Polygon entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Polygon");
    expect(response.structuredContent.message).toContain('"Polygon"');
    expect(response.structuredContent.message).toContain("4");
    expect(response.structuredContent.stats?.totalEntities).toBe(8);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.polygon).toEqual(validArgs.polygon);
    expect(command.entity.id).toMatch(/^polygon_/);
    expect(command.entity.position).toBeUndefined();
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({ ...validArgs, name: "My Zone" });

    expect(response.structuredContent.entityName).toBe("My Zone");
    expect(response.structuredContent.message).toContain("My Zone");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({
      ...validArgs,
      id: "polygon-42",
    });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("polygon-42");
    expect(response.structuredContent.entityId).toBe("polygon-42");
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Viewer error"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.structuredContent.message).toContain("Failed");
    expect(response.isError).toBe(true);
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Cannot render polygon",
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
  });

  it("forwards description to entity command", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({ ...validArgs, description: "<p>An area</p>" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>An area</p>");
  });
});
