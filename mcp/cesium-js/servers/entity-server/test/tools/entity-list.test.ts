import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import type { EntityListResponse } from "../../src/schemas/index";
import { registerListEntities } from "../../src/tools/entity-list";

describe("registerListEntities", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };
  let registeredHandler: (args: unknown) => Promise<{
    structuredContent: EntityListResponse;
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

    registerListEntities(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );
  });

  it('registers tool with name "entity_list"', () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "entity_list",
      expect.objectContaining({ title: "List All Entities" }),
      expect.any(Function),
    );
  });

  it("returns empty list when no entities", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities: [],
    });

    const response = await registeredHandler({});

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.entities).toEqual([]);
    expect(response.structuredContent.totalCount).toBe(0);
    expect(response.structuredContent.filteredCount).toBe(0);
    expect(response.structuredContent.message).toContain("0 entities");
  });

  it("returns populated entity list", async () => {
    const entities = [
      { id: "point_001", name: "My Point", type: "point" },
      { id: "billboard_001", name: "My Billboard", type: "billboard" },
    ];
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities,
    });

    const response = await registeredHandler({});

    expect(response.structuredContent.success).toBe(true);
    expect(response.structuredContent.entities).toHaveLength(2);
    expect(response.structuredContent.totalCount).toBe(2);
    expect(response.structuredContent.filteredCount).toBe(2);
  });

  it("sends entity_list command with default options", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities: [],
    });

    await registeredHandler({});

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({
      type: "entity_list",
      includeDetails: false,
    });
  });

  it("passes includeDetails=true to command", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities: [],
    });

    await registeredHandler({ includeDetails: true });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({
      type: "entity_list",
      includeDetails: true,
    });
  });

  it("passes filterByType to command", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities: [],
    });

    await registeredHandler({ filterByType: "point" });

    const command = mockCommunicationServer.executeCommand.mock.calls[0][0];
    expect(command).toMatchObject({
      type: "entity_list",
      filterByType: "point",
    });
  });

  it("applies filteredCount based on filterByType", async () => {
    const entities = [
      { id: "point_001", name: "P1", type: "point" },
      { id: "billboard_001", name: "B1", type: "billboard" },
    ];
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities,
    });

    const response = await registeredHandler({ filterByType: "point" });

    expect(response.structuredContent.totalCount).toBe(2);
    expect(response.structuredContent.filteredCount).toBe(1);
    expect(response.structuredContent.message).toContain("type 'point'");
  });

  it("returns singular message for one entity", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: true,
      entities: [{ id: "p1", type: "point" }],
    });

    const response = await registeredHandler({});

    expect(response.structuredContent.message).toContain("1 entity");
    expect(response.structuredContent.message).not.toContain("entities");
  });

  it("returns error response when executeCommand rejects", async () => {
    mockCommunicationServer.executeCommand.mockRejectedValue(
      new Error("Viewer not ready"),
    );

    const response = await registeredHandler({});

    expect(response.structuredContent.success).toBe(false);
    expect(response.structuredContent.entities).toEqual([]);
    expect(response.isError).toBe(true);
  });

  it("returns error response when result.success is false", async () => {
    mockCommunicationServer.executeCommand.mockResolvedValue({
      success: false,
      error: "Scene not initialized",
    });

    const response = await registeredHandler({});

    expect(response.structuredContent.success).toBe(false);
    expect(response.isError).toBe(true);
  });
});
