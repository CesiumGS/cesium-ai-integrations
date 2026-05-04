import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  McpServer,
  RegisteredTool,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { DomainRegistry } from "../src/domain-registry";
import type { DomainDefinition } from "../src/domains";

/**
 * Build a minimal RegisteredTool stub with spy-able enable/disable.
 */
function makeTool(overrides: Partial<RegisteredTool> = {}): RegisteredTool {
  return {
    enabled: true,
    enable: vi.fn(),
    disable: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    handler: vi.fn(),
    ...overrides,
  } as unknown as RegisteredTool;
}

/**
 * Build a mock McpServer whose registerTool returns a fresh tool stub
 * and records the registered name.
 */
function makeServer() {
  const tools = new Map<string, RegisteredTool>();
  const server = {
    registerTool: vi.fn((name: string) => {
      const tool = makeTool();
      tools.set(name, tool);
      return tool;
    }),
  };
  return { server: server as unknown as McpServer, tools };
}

describe("DomainRegistry", () => {
  let registry: DomainRegistry;
  let server: McpServer;
  let tools: Map<string, RegisteredTool>;

  beforeEach(() => {
    registry = new DomainRegistry();
    const built = makeServer();
    server = built.server;
    tools = built.tools;
  });

  describe("registerDomain", () => {
    it("tracks every tool registered during the domain's registerTools call", () => {
      const domain: DomainDefinition = {
        name: "camera",
        registerTools: (mcpServer) => {
          mcpServer.registerTool(
            "camera_fly_to",
            {} as never,
            (() => ({})) as never,
          );
          mcpServer.registerTool(
            "camera_look_at",
            {} as never,
            (() => ({})) as never,
          );
        },
      };

      registry.registerDomain(domain, server, undefined);

      const state = registry.getDomain("camera");
      expect(state).toBeDefined();
      expect(state?.enabled).toBe(true);
      expect(state?.tools.size).toBe(2);
      expect(state?.tools.has("camera_fly_to")).toBe(true);
      expect(state?.tools.has("camera_look_at")).toBe(true);
    });

    it("restores the original registerTool after registration", () => {
      const originalRegisterTool = server.registerTool;
      const domain: DomainDefinition = {
        name: "camera",
        registerTools: (mcpServer) => {
          mcpServer.registerTool("t1", {} as never, (() => ({})) as never);
        },
      };

      registry.registerDomain(domain, server, undefined);

      expect(server.registerTool).toBe(originalRegisterTool);
    });

    it("restores the original registerTool even when registration throws", () => {
      const originalRegisterTool = server.registerTool;
      const boom = new Error("boom");
      const domain: DomainDefinition = {
        name: "bad",
        registerTools: () => {
          throw boom;
        },
      };

      expect(() => registry.registerDomain(domain, server, undefined)).toThrow(
        boom,
      );
      expect(server.registerTool).toBe(originalRegisterTool);
    });

    it("does not cross-track tools between domains", () => {
      const camera: DomainDefinition = {
        name: "camera",
        registerTools: (s) => {
          s.registerTool("camera_one", {} as never, (() => ({})) as never);
        },
      };
      const entity: DomainDefinition = {
        name: "entity",
        registerTools: (s) => {
          s.registerTool("entity_one", {} as never, (() => ({})) as never);
        },
      };

      registry.registerDomain(camera, server, undefined);
      registry.registerDomain(entity, server, undefined);

      expect(registry.getDomain("camera")?.tools.has("camera_one")).toBe(true);
      expect(registry.getDomain("camera")?.tools.has("entity_one")).toBe(false);
      expect(registry.getDomain("entity")?.tools.has("entity_one")).toBe(true);
      expect(registry.getDomain("entity")?.tools.has("camera_one")).toBe(false);
    });

    it("passes the communicationServer argument through to the domain's registerTools", () => {
      const commServer = {
        executeCommand: vi.fn(),
      } as unknown as ICommunicationServer;
      const registerTools = vi.fn();
      const domain: DomainDefinition = {
        name: "camera",
        registerTools,
      };

      registry.registerDomain(domain, server, commServer);

      expect(registerTools).toHaveBeenCalledWith(server, commServer);
    });
  });

  describe("disableDomain / enableDomain", () => {
    const seedDomain = (name: string, toolNames: string[]) => {
      const domain: DomainDefinition = {
        name,
        registerTools: (s) => {
          for (const t of toolNames) {
            s.registerTool(t, {} as never, (() => ({})) as never);
          }
        },
      };
      registry.registerDomain(domain, server, undefined);
    };

    it("calls disable() on every tool of the domain", () => {
      seedDomain("camera", ["a", "b"]);
      const result = registry.disableDomain("camera");

      expect(result).toBe(true);
      expect(registry.getDomain("camera")?.enabled).toBe(false);
      expect(tools.get("a")?.disable).toHaveBeenCalledTimes(1);
      expect(tools.get("b")?.disable).toHaveBeenCalledTimes(1);
    });

    it("calls enable() on every tool when re-enabling", () => {
      seedDomain("camera", ["a"]);
      registry.disableDomain("camera");

      const result = registry.enableDomain("camera");

      expect(result).toBe(true);
      expect(registry.getDomain("camera")?.enabled).toBe(true);
      expect(tools.get("a")?.enable).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when disabling an already-disabled domain", () => {
      seedDomain("camera", ["a"]);
      registry.disableDomain("camera");

      const result = registry.disableDomain("camera");

      expect(result).toBe(true);
      expect(tools.get("a")?.disable).toHaveBeenCalledTimes(1); // not twice
    });

    it("is a no-op when enabling an already-enabled domain", () => {
      seedDomain("camera", ["a"]);
      const result = registry.enableDomain("camera");

      expect(result).toBe(true);
      expect(tools.get("a")?.enable).not.toHaveBeenCalled();
    });

    it("returns false for unknown domain names", () => {
      expect(registry.disableDomain("nope")).toBe(false);
      expect(registry.enableDomain("nope")).toBe(false);
    });
  });

  describe("listDomains / getDomainNames", () => {
    it("returns an empty list when no domains are registered", () => {
      expect(registry.listDomains()).toEqual([]);
      expect(registry.getDomainNames()).toEqual([]);
    });

    it("returns a snapshot of every domain with enabled status and tool names", () => {
      const camera: DomainDefinition = {
        name: "camera",
        registerTools: (s) => {
          s.registerTool("a", {} as never, (() => ({})) as never);
          s.registerTool("b", {} as never, (() => ({})) as never);
        },
      };
      const entity: DomainDefinition = {
        name: "entity",
        registerTools: (s) => {
          s.registerTool("c", {} as never, (() => ({})) as never);
        },
      };
      registry.registerDomain(camera, server, undefined);
      registry.registerDomain(entity, server, undefined);
      registry.disableDomain("entity");

      const list = registry.listDomains();

      expect(list).toHaveLength(2);
      expect(list[0]).toEqual({
        name: "camera",
        enabled: true,
        toolCount: 2,
        tools: ["a", "b"],
      });
      expect(list[1]).toEqual({
        name: "entity",
        enabled: false,
        toolCount: 1,
        tools: ["c"],
      });
      expect(registry.getDomainNames()).toEqual(["camera", "entity"]);
    });
  });
});
