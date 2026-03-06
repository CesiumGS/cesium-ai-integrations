import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddBoxEntity } from "../../src/tools/entity-add-box";

describe("registerAddBoxEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    position: { longitude: -105.1, latitude: 40.2, height: 0 },
    box: { dimensions: { x: 100, y: 50, z: 30 } },
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

    registerAddBoxEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_box"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_box",
      expect.objectContaining({ title: "Add Box Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 5,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Box entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Box");
    expect(response.structuredContent.message).toContain('"Box"');
    expect(response.structuredContent.position).toEqual(validArgs.position);
    expect(response.structuredContent.stats?.totalEntities).toBe(5);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.box).toEqual(validArgs.box);
    expect(command.entity.position).toEqual(validArgs.position);
    expect(command.entity.orientation).toBeUndefined();
    expect(command.entity.id).toMatch(/^box_/);
  });

  it("includes orientation when provided", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const orientation = { heading: 30, pitch: 0, roll: 0 };
    await registeredHandler({ ...validArgs, orientation });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.orientation).toEqual(orientation);
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({
      ...validArgs,
      name: "Building A",
    });

    expect(response.structuredContent.entityName).toBe("Building A");
    expect(response.structuredContent.message).toContain("Building A");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({ ...validArgs, id: "box-42" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("box-42");
    expect(response.structuredContent.entityId).toBe("box-42");
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Viewer error"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain("Viewer error");
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Cannot render box",
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain("Cannot render box");
  });

  it("forwards description to entity command", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({ ...validArgs, description: "<p>A box</p>" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>A box</p>");
  });
});
