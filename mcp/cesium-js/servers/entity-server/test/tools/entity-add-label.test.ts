import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityResponse } from "../../src/schemas/index";
import { registerAddLabelEntity } from "../../src/tools/entity-add-label";

describe("registerAddLabelEntity", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityResponse;
    isError: boolean;
  }>;

  const validArgs = {
    position: { longitude: -105.1, latitude: 40.2, height: 0 },
    label: { text: "Hello World" },
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

    registerAddLabelEntity(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_add_label"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_add_label",
      expect.objectContaining({ title: "Add Label Entity" }),
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
    expect(response.structuredContent.message).toContain("Label entity");
    expect(response.isError).toBe(false);
    expect(response.structuredContent.message).toContain("Hello World");
    expect(response.structuredContent.entityName).toBe("Label");
    expect(response.structuredContent.message).toContain('"Label"');
    expect(response.structuredContent.position).toEqual(validArgs.position);
    expect(response.structuredContent.stats?.totalEntities).toBe(5);

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.type).toBe("entity_add");
    expect(command.entity.label).toEqual(validArgs.label);
    expect(command.entity.position).toEqual(validArgs.position);
    expect(command.entity.id).toMatch(/^label_/);
  });

  it("uses provided name", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 2,
    });

    const response = await registeredHandler({
      ...validArgs,
      name: "My Label",
    });

    expect(response.structuredContent.entityName).toBe("My Label");
    expect(response.structuredContent.message).toContain("My Label");
  });

  it("handles success with provided id", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      totalEntities: 1,
    });

    const response = await registeredHandler({ ...validArgs, id: "label-42" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.id).toBe("label-42");
    expect(response.structuredContent.entityId).toBe("label-42");
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

    await registeredHandler({
      ...validArgs,
      description: "<p>A text label</p>",
    });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command.entity.description).toBe("<p>A text label</p>");
  });
});
