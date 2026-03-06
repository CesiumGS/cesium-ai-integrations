import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ICommunicationServer } from "../../../src/communications/communication-server";
import type { MCPServerConfig } from "../../../src/models/mcpServerConfig";
import { CesiumMCPServer } from "../../../src/mcp/CesiumMCPServer";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// ---------------------------------------------------------------------------
// Hoisted mock state (must be defined before vi.mock factories run)
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  const mcpConnect = vi.fn().mockResolvedValue(undefined);
  const mcpServerInstance = { connect: mcpConnect };

  const McpServerMock = vi.fn(function () {
    return mcpServerInstance;
  });

  const mockHttpServerClose = vi.fn((cb: () => void) => cb && cb());
  const mockHttpServer = { close: mockHttpServerClose };

  const mockExpressApp = {
    use: vi.fn(),
    all: vi.fn(),
    listen: vi.fn((_port: number, cb: () => void) => {
      if (cb) {
        cb();
      }
      return mockHttpServer;
    }),
  };

  return {
    mcpConnect,
    mcpServerInstance,
    McpServerMock,
    mockHttpServer,
    mockHttpServerClose,
    mockExpressApp,
  };
});

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: mocks.McpServerMock,
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(function () {
    return { _type: "stdio" };
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn(function () {
    return { handleRequest: vi.fn() };
  }),
}));

vi.mock("express", () => {
  const expressMock = vi.fn(() => mocks.mockExpressApp);
  (expressMock as unknown as Record<string, unknown>).json = vi.fn(() =>
    vi.fn(),
  );
  return { default: expressMock };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeConfig(overrides: Partial<MCPServerConfig> = {}): MCPServerConfig {
  return {
    name: "test-server",
    version: "1.0.0",
    silent: true,
    ...overrides,
  };
}

function makeCommunicationServer(
  overrides: Partial<ICommunicationServer> = {},
): ICommunicationServer {
  return {
    start: vi.fn().mockResolvedValue(3000),
    stop: vi.fn().mockResolvedValue(undefined),
    executeCommand: vi.fn(),
    getStats: vi.fn().mockReturnValue({
      port: 3000,
      clients: 0,
      uptime: 0,
      commandsExecuted: 0,
    }),
    ...overrides,
  } as unknown as ICommunicationServer;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CesiumMCPServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset listen mock so each test gets a fresh mockHttpServer reference
    mocks.mockExpressApp.listen.mockImplementation(
      (_port: number, cb: () => void) => {
        if (cb) {
          cb();
        }
        return mocks.mockHttpServer;
      },
    );
  });

  // -------------------------------------------------------------------------
  describe("registerTools()", () => {
    it("accumulates multiple registration functions", async () => {
      const server = new CesiumMCPServer(makeConfig());
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      server.registerTools(fn1, fn2);
      await server.start();

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("passes mcpServer and communicationServer to each registration function", async () => {
      const commServer = makeCommunicationServer();
      const server = new CesiumMCPServer(
        makeConfig({ communicationServerPort: 3000 }),
        commServer,
      );
      const fn = vi.fn();

      server.registerTools(fn);
      await server.start();

      // First arg is the internal McpServer instance, second is the commServer
      expect(fn).toHaveBeenCalledWith(mocks.mcpServerInstance, commServer);
    });

    it("passes undefined for communicationServer when none was provided", async () => {
      const server = new CesiumMCPServer(makeConfig());
      const fn = vi.fn();

      server.registerTools(fn);
      await server.start();

      expect(fn).toHaveBeenCalledWith(mocks.mcpServerInstance, undefined);
    });

    it("can be called multiple times and all functions are called on start", async () => {
      const server = new CesiumMCPServer(makeConfig());
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const fn3 = vi.fn();

      server.registerTools(fn1);
      server.registerTools(fn2, fn3);
      await server.start();

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("start() — stdio transport (default)", () => {
    it("starts the communication server when one is provided with a port", async () => {
      const commServer = makeCommunicationServer();
      const server = new CesiumMCPServer(
        makeConfig({ communicationServerPort: 3000 }),
        commServer,
      );

      await server.start();

      expect(commServer.start).toHaveBeenCalledWith(
        expect.objectContaining({ port: 3000 }),
      );
    });

    it("does not start the communication server when none is provided", async () => {
      const server = new CesiumMCPServer(makeConfig());
      await expect(server.start()).resolves.not.toThrow();
    });

    it("does not start the communication server when port is omitted", async () => {
      const commServer = makeCommunicationServer();
      // communicationServerPort deliberately omitted → serverConfig won't be built
      const server = new CesiumMCPServer(makeConfig(), commServer);

      await server.start();

      expect(commServer.start).not.toHaveBeenCalled();
    });

    it("connects the McpServer with a StdioServerTransport", async () => {
      const server = new CesiumMCPServer(makeConfig());
      await server.start();

      expect(StdioServerTransport).toHaveBeenCalledTimes(1);
      expect(mocks.mcpConnect).toHaveBeenCalledWith(
        expect.objectContaining({ _type: "stdio" }),
      );
    });

    it("uses strictPort: true by default when communicationServerStrictPort is unset", async () => {
      const commServer = makeCommunicationServer();
      const server = new CesiumMCPServer(
        makeConfig({ communicationServerPort: 4000 }),
        commServer,
      );
      await server.start();

      expect(commServer.start).toHaveBeenCalledWith(
        expect.objectContaining({ strictPort: true }),
      );
    });

    it("respects communicationServerMaxRetries when provided", async () => {
      const commServer = makeCommunicationServer();
      const server = new CesiumMCPServer(
        makeConfig({
          communicationServerPort: 4000,
          communicationServerMaxRetries: 3,
        }),
        commServer,
      );
      await server.start();

      expect(commServer.start).toHaveBeenCalledWith(
        expect.objectContaining({ maxRetries: 3 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  describe("start() — streamable-http transport", () => {
    it("creates StreamableHTTPServerTransport and listens on an offset port", async () => {
      const server = new CesiumMCPServer(
        makeConfig({
          mcpTransport: "streamable-http",
          communicationServerPort: 3000,
        }),
      );

      await server.start();

      expect(StreamableHTTPServerTransport).toHaveBeenCalledTimes(1);
      expect(mocks.mcpConnect).toHaveBeenCalledTimes(1);
      // listen is called on the express app with communicationServerPort + MCP_PORT_OFFSET (1000)
      expect(mocks.mockExpressApp.listen).toHaveBeenCalledWith(
        4000,
        expect.any(Function),
      );
    });

    it("falls back to port 3000 + offset when communicationServerPort is unset", async () => {
      const server = new CesiumMCPServer(
        makeConfig({ mcpTransport: "streamable-http" }),
      );

      await server.start();

      expect(mocks.mockExpressApp.listen).toHaveBeenCalledWith(
        4000,
        expect.any(Function),
      );
    });

    it("uses the /mcp endpoint", async () => {
      const server = new CesiumMCPServer(
        makeConfig({ mcpTransport: "streamable-http" }),
      );

      await server.start();

      expect(mocks.mockExpressApp.all).toHaveBeenCalledWith(
        "/mcp",
        expect.any(Function),
      );
    });
  });

  // -------------------------------------------------------------------------
  describe("start() — error handling", () => {
    it("throws for an unsupported transport type", async () => {
      const server = new CesiumMCPServer(
        makeConfig({ mcpTransport: "invalid-transport" as "stdio" }),
      );

      await expect(server.start()).rejects.toThrow(
        "Unsupported transport type: invalid-transport",
      );
    });

    it("propagates communication server start failures", async () => {
      const startError = new Error("Port already in use");
      const commServer = makeCommunicationServer({
        start: vi.fn().mockRejectedValue(startError),
      });
      const server = new CesiumMCPServer(
        makeConfig({ communicationServerPort: 3000 }),
        commServer,
      );

      await expect(server.start()).rejects.toThrow("Port already in use");
    });

    it("propagates McpServer.connect failures", async () => {
      mocks.mcpConnect.mockRejectedValueOnce(
        new Error("Transport init failed"),
      );
      const server = new CesiumMCPServer(makeConfig());

      await expect(server.start()).rejects.toThrow("Transport init failed");
    });
  });

  // -------------------------------------------------------------------------
  describe("stop()", () => {
    it("calls communicationServer.stop() when present", async () => {
      const commServer = makeCommunicationServer();
      const server = new CesiumMCPServer(makeConfig(), commServer);

      await server.start();
      await server.stop();

      expect(commServer.stop).toHaveBeenCalledTimes(1);
    });

    it("resolves without error when no communication server was provided", async () => {
      const server = new CesiumMCPServer(makeConfig());
      await server.start();

      await expect(server.stop()).resolves.not.toThrow();
    });

    it("closes the mcpTransportServer before stopping the communication server", async () => {
      const stopOrder: string[] = [];
      mocks.mockHttpServerClose.mockImplementationOnce((cb: () => void) => {
        stopOrder.push("httpServer.close");
        if (cb) {
          cb();
        }
      });
      const commServer = makeCommunicationServer({
        stop: vi.fn().mockImplementation(async () => {
          stopOrder.push("commServer.stop");
        }),
      });

      const server = new CesiumMCPServer(
        makeConfig({
          mcpTransport: "streamable-http",
          communicationServerPort: 3000,
        }),
        commServer,
      );
      await server.start();
      await server.stop();

      expect(stopOrder).toEqual(["httpServer.close", "commServer.stop"]);
    });
  });
});
