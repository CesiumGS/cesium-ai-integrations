import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddPointEntity } from "../../src/tools/entity-add-point";

describe("registerAddPointEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    position: { longitude: -105.1, latitude: 40.2, height: 0 },
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

    registerAddPointEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_point"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_point",
      expect.objectContaining({ title: "Add Point Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Point entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Point");
    expect(response.structuredContent.message).toContain('"Point"');
    expect(response.structuredContent.position).toEqual(validArgs.position);
    expect(response.structuredContent.stats?.totalEntities).toBe(2);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({ type: "entity_add" });
    expect(command.entity.position).toEqual(validArgs.position);
    expect(command.entity.id).toMatch(/^point_/);
    expect(command.entity.point).toBeDefined();
    expect(command.entity.point.pixelSize).toBeDefined();
    expect(command.entity.point.color).toBeDefined();
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({
      ...validArgs,
      name: "My Custom Point",
    });

    expect(response.structuredContent.entityName).toBe("My Custom Point");
    expect(response.structuredContent.message).toContain("My Custom Point");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({ ...validArgs, id: "point-42" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("point-42");
    expect(response.structuredContent.entityId).toBe("point-42");
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Connection refused"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.structuredContent.message).toContain("Failed");
    expect(response.isError).toBe(true);
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Cesium viewer not found",
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

    await registeredHandler({ ...validArgs, description: "<p>A point</p>" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>A point</p>");
  });

  it("uses explicit point properties when point arg is provided", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const customPoint = { pixelSize: 20, color: { red: 1, green: 0, blue: 0 } };
    await registeredHandler({ ...validArgs, point: customPoint });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.point.pixelSize).toBe(20);
    expect(command.entity.point.color).toEqual({ red: 1, green: 0, blue: 0 });
  });
});
