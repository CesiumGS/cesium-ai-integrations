import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { registerTilesTools } from "../../src/tools/index";

describe("registerTilesTools", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockCommunicationServer: { executeCommand: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn(),
    };
    mockCommunicationServer = {
      executeCommand: vi.fn(),
    };
  });

  it("should throw when no communication server is provided", () => {
    expect(() =>
      registerTilesTools(
        mockServer as unknown as McpServer,
        undefined as unknown as ICommunicationServer,
      ),
    ).toThrow("Tiles tools require a communication server");
  });

  it("should register all four tiles tools", () => {
    registerTilesTools(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );

    expect(mockServer.registerTool).toHaveBeenCalledTimes(4);

    const toolNames = mockServer.registerTool.mock.calls.map((call) => call[0]);
    expect(toolNames).toContain("tileset_add");
    expect(toolNames).toContain("tileset_remove");
    expect(toolNames).toContain("tileset_list");
    expect(toolNames).toContain("tileset_style");
  });

  it("should register tileset_add with correct config", () => {
    registerTilesTools(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );

    const addCall = mockServer.registerTool.mock.calls.find(
      (call) => call[0] === "tileset_add",
    );
    expect(addCall).toBeDefined();
    expect(addCall![1]).toMatchObject({
      title: "Add 3D Tileset",
      description: expect.stringContaining("3D Tiles"),
    });
    expect(typeof addCall![2]).toBe("function");
  });

  it("should register tileset_remove with correct config", () => {
    registerTilesTools(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );

    const removeCall = mockServer.registerTool.mock.calls.find(
      (call) => call[0] === "tileset_remove",
    );
    expect(removeCall).toBeDefined();
    expect(removeCall![1]).toMatchObject({
      title: "Remove 3D Tileset",
      description: expect.stringContaining("Remove a 3D tileset"),
    });
    expect(typeof removeCall![2]).toBe("function");
  });

  it("should register tileset_list with correct config", () => {
    registerTilesTools(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );

    const listCall = mockServer.registerTool.mock.calls.find(
      (call) => call[0] === "tileset_list",
    );
    expect(listCall).toBeDefined();
    expect(listCall![1]).toMatchObject({
      title: "List 3D Tilesets",
      description: expect.stringContaining("list"),
    });
    expect(typeof listCall![2]).toBe("function");
  });

  it("should ensure all registered tools have inputSchema and outputSchema", () => {
    registerTilesTools(
      mockServer as unknown as McpServer,
      mockCommunicationServer as unknown as ICommunicationServer,
    );

    mockServer.registerTool.mock.calls.forEach((call) => {
      const config = call[1];
      expect(config).toHaveProperty("inputSchema");
      expect(config).toHaveProperty("outputSchema");
      expect(config.inputSchema).toBeDefined();
      expect(config.outputSchema).toBeDefined();
    });
  });
});
