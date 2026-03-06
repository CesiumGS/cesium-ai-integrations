import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddRectangleEntity } from "../../src/tools/entity-add-rectangle";

describe("registerAddRectangleEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    rectangle: {
      coordinates: {
        west: -106.0,
        south: 39.0,
        east: -104.0,
        north: 41.0,
      },
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

    registerAddRectangleEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_rectangle"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_rectangle",
      expect.objectContaining({ title: "Add Rectangle Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 11,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Rectangle entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Rectangle");
    expect(response.structuredContent.message).toContain('"Rectangle"');
    expect(response.structuredContent.message).toContain("40.0000");
    expect(response.structuredContent.message).toContain("-105.0000");
    expect(response.structuredContent.stats?.totalEntities).toBe(11);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.rectangle).toEqual(validArgs.rectangle);
    expect(command.entity.id).toMatch(/^rectangle_/);
    expect(command.entity.position).toBeUndefined();
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({
      ...validArgs,
      name: "My Region",
    });

    expect(response.structuredContent.entityName).toBe("My Region");
    expect(response.structuredContent.message).toContain("My Region");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({ ...validArgs, id: "rect-42" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("rect-42");
    expect(response.structuredContent.entityId).toBe("rect-42");
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Viewer not ready"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.structuredContent.message).toContain("Failed");
    expect(response.isError).toBe(true);
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Render error",
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

    await registeredHandler({ ...validArgs, description: "<p>A region</p>" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>A region</p>");
  });
});
