import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddPolylineEntity } from "../../src/tools/entity-add-polyline";

describe("registerAddPolylineEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    polyline: {
      positions: [
        { longitude: -105.0, latitude: 40.0, height: 0 },
        { longitude: -104.0, latitude: 40.5, height: 0 },
        { longitude: -103.0, latitude: 41.0, height: 0 },
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

    registerAddPolylineEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_polyline"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_polyline",
      expect.objectContaining({ title: "Add Polyline Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 9,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Polyline entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Polyline");
    expect(response.structuredContent.message).toContain('"Polyline"');
    expect(response.structuredContent.message).toContain("3");
    expect(response.structuredContent.stats?.totalEntities).toBe(9);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.polyline).toEqual(validArgs.polyline);
    expect(command.entity.id).toMatch(/^polyline_/);
    expect(command.entity.position).toBeUndefined();
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({
      ...validArgs,
      name: "My Route",
    });

    expect(response.structuredContent.entityName).toBe("My Route");
    expect(response.structuredContent.message).toContain("My Route");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({
      ...validArgs,
      id: "polyline-42",
    });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("polyline-42");
    expect(response.structuredContent.entityId).toBe("polyline-42");
  });

  it("passes width through polyline config", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({
      polyline: { ...validArgs.polyline, width: 3 },
    });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.polyline.width).toBe(3);
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Network error"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.structuredContent.message).toContain("Failed");
    expect(response.isError).toBe(true);
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Render failed",
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

    await registeredHandler({ ...validArgs, description: "<p>A route</p>" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>A route</p>");
  });
});
