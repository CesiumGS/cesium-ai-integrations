import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddCylinderEntity } from "../../src/tools/entity-add-cylinder";

describe("registerAddCylinderEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    position: { longitude: -105.1, latitude: 40.2, height: 0 },
    cylinder: { length: 100, topRadius: 20, bottomRadius: 20 },
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

    registerAddCylinderEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_cylinder"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_cylinder",
      expect.objectContaining({ title: "Add Cylinder Entity" }),
      expect.any(Function),
    );
  });

  it("handles basic success with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 3,
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.message).toContain("Cylinder entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.entityName).toBe("Cylinder");
    expect(response.structuredContent.message).toContain('"Cylinder"');
    expect(response.structuredContent.position).toEqual(validArgs.position);
    expect(response.structuredContent.stats?.totalEntities).toBe(3);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.cylinder).toEqual(validArgs.cylinder);
    expect(command.entity.position).toEqual(validArgs.position);
    expect(command.entity.orientation).toBeUndefined();
    expect(command.entity.id).toMatch(/^cylinder_/);
  });

  it("includes orientation when provided", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const orientation = { heading: 45, pitch: 0, roll: 0 };
    await registeredHandler({ ...validArgs, orientation });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.orientation).toEqual(orientation);
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({ ...validArgs, name: "Tower" });

    expect(response.structuredContent.entityName).toBe("Tower");
    expect(response.structuredContent.message).toContain("Tower");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({ ...validArgs, id: "cyl-42" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("cyl-42");
    expect(response.structuredContent.entityId).toBe("cyl-42");
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Connection error"),
    );

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain("Connection error");
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Render failed",
    });

    const response = await registeredHandler(validArgs);

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
    expect(response.structuredContent.message).toContain("Render failed");
  });

  it("forwards description to entity command", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    await registeredHandler({ ...validArgs, description: "<p>A tower</p>" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>A tower</p>");
  });
});
