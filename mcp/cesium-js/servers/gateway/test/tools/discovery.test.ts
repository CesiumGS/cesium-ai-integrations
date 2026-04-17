import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DomainRegistry } from "../../src/domain-registry";
import { registerDiscoveryTools } from "../../src/tools/discovery";

type ToolHandler = (args?: Record<string, unknown>) =>
  | {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    }
  | Promise<{
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    }>;

describe("registerDiscoveryTools", () => {
  let registry: DomainRegistry;
  let server: { registerTool: ReturnType<typeof vi.fn> };
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    registry = new DomainRegistry();
    handlers = new Map();
    server = {
      registerTool: vi.fn(
        (name: string, _config: unknown, handler: unknown) => {
          handlers.set(name, handler as ToolHandler);
        },
      ),
    };

    // Seed two domains into the registry
    registry.registerDomain(
      {
        name: "camera",
        registerTools: (s) => {
          s.registerTool("camera_fly_to", {} as never, (() => ({})) as never);
          s.registerTool("camera_look_at", {} as never, (() => ({})) as never);
        },
      },
      makeFakeMcpServer(),
      undefined,
    );
    registry.registerDomain(
      {
        name: "entity",
        registerTools: (s) => {
          s.registerTool("entity_create", {} as never, (() => ({})) as never);
        },
      },
      makeFakeMcpServer(),
      undefined,
    );

    registerDiscoveryTools(server as unknown as McpServer, registry);
  });

  it("registers three tools: list, enable, disable", () => {
    expect(server.registerTool).toHaveBeenCalledTimes(3);
    const names = server.registerTool.mock.calls.map((c) => c[0]);
    expect(names).toEqual([
      "cesium_list_domains",
      "cesium_enable_domain",
      "cesium_disable_domain",
    ]);
  });

  describe("cesium_list_domains", () => {
    it("returns a summary containing every domain's name and tool count", async () => {
      const handler = handlers.get("cesium_list_domains");
      expect(handler).toBeDefined();

      const result = await handler!();

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain("camera");
      expect(text).toContain("(2 tools)");
      expect(text).toContain("entity");
      expect(text).toContain("(1 tools)");
      expect(text).toContain("Total: 2 domains, 3 tools");
    });

    it("reflects disabled status with [OFF]", async () => {
      registry.disableDomain("entity");
      const handler = handlers.get("cesium_list_domains")!;
      const result = await handler();

      expect(result.content[0].text).toContain("[ON] camera");
      expect(result.content[0].text).toContain("[OFF] entity");
    });
  });

  describe("cesium_disable_domain", () => {
    it("disables an existing domain", async () => {
      const handler = handlers.get("cesium_disable_domain")!;
      const result = await handler({ domain: "camera" });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("camera");
      expect(registry.getDomain("camera")?.enabled).toBe(false);
    });

    it("returns isError=true for an unknown domain", async () => {
      const handler = handlers.get("cesium_disable_domain")!;
      const result = await handler({ domain: "ghost" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("ghost");
      expect(result.content[0].text).toContain("not found");
    });
  });

  describe("cesium_enable_domain", () => {
    it("re-enables a previously disabled domain", async () => {
      registry.disableDomain("camera");
      const handler = handlers.get("cesium_enable_domain")!;
      const result = await handler({ domain: "camera" });

      expect(result.isError).toBeUndefined();
      expect(registry.getDomain("camera")?.enabled).toBe(true);
      expect(result.content[0].text).toContain("camera");
    });

    it("returns isError=true for an unknown domain", async () => {
      const handler = handlers.get("cesium_enable_domain")!;
      const result = await handler({ domain: "ghost" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("ghost");
    });
  });
});

/**
 * Small helper that returns a McpServer-shaped object whose registerTool
 * yields a fresh tool stub every time — used for seeding the registry in tests.
 */
function makeFakeMcpServer(): McpServer {
  return {
    registerTool: vi.fn(() => ({
      enabled: true,
      enable: vi.fn(),
      disable: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      handler: vi.fn(),
    })),
  } as unknown as McpServer;
}
