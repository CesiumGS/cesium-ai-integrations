import { describe, it, expect } from "vitest";
import {
  DEFAULT_COMMAND_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  MCP_PORT_OFFSET,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  TIMEOUT_BUFFER_MS,
  ServerDefaults,
  ResponseEmoji,
  RESPONSE_EMOJIS,
} from "../../src/utils/constants";

// ---------------------------------------------------------------------------
describe("Numeric constants", () => {
  describe("DEFAULT_COMMAND_TIMEOUT_MS", () => {
    it("equals 10000", () => expect(DEFAULT_COMMAND_TIMEOUT_MS).toBe(10000));
    it("is a positive number", () =>
      expect(DEFAULT_COMMAND_TIMEOUT_MS).toBeGreaterThan(0));
  });

  describe("HEARTBEAT_INTERVAL_MS", () => {
    it("equals 30000", () => expect(HEARTBEAT_INTERVAL_MS).toBe(30000));
    it("is a positive number", () =>
      expect(HEARTBEAT_INTERVAL_MS).toBeGreaterThan(0));
  });

  describe("MCP_PORT_OFFSET", () => {
    it("equals 1000", () => expect(MCP_PORT_OFFSET).toBe(1000));
    it("is a positive number", () =>
      expect(MCP_PORT_OFFSET).toBeGreaterThan(0));
  });

  describe("GRACEFUL_SHUTDOWN_TIMEOUT_MS", () => {
    it("equals 5000", () => expect(GRACEFUL_SHUTDOWN_TIMEOUT_MS).toBe(5000));
    it("is a positive number", () =>
      expect(GRACEFUL_SHUTDOWN_TIMEOUT_MS).toBeGreaterThan(0));
  });

  describe("TIMEOUT_BUFFER_MS", () => {
    it("equals 2000", () => expect(TIMEOUT_BUFFER_MS).toBe(2000));
    it("is a positive number", () =>
      expect(TIMEOUT_BUFFER_MS).toBeGreaterThan(0));
  });
});

// ---------------------------------------------------------------------------
describe("ServerDefaults", () => {
  it("COMMAND_TIMEOUT_MS equals DEFAULT_COMMAND_TIMEOUT_MS", () =>
    expect(ServerDefaults.COMMAND_TIMEOUT_MS).toBe(DEFAULT_COMMAND_TIMEOUT_MS));

  it("HEARTBEAT_INTERVAL_MS equals HEARTBEAT_INTERVAL_MS constant", () =>
    expect(ServerDefaults.HEARTBEAT_INTERVAL_MS).toBe(HEARTBEAT_INTERVAL_MS));

  it("PORT_OFFSET equals MCP_PORT_OFFSET", () =>
    expect(ServerDefaults.PORT_OFFSET).toBe(MCP_PORT_OFFSET));

  it("SHUTDOWN_TIMEOUT_MS equals GRACEFUL_SHUTDOWN_TIMEOUT_MS", () =>
    expect(ServerDefaults.SHUTDOWN_TIMEOUT_MS).toBe(
      GRACEFUL_SHUTDOWN_TIMEOUT_MS,
    ));

  it("MAX_RETRIES is 10", () => expect(ServerDefaults.MAX_RETRIES).toBe(10));

  it('CORS_ORIGIN is "*"', () => expect(ServerDefaults.CORS_ORIGIN).toBe("*"));
});

// ---------------------------------------------------------------------------
describe("ResponseEmoji enum", () => {
  it('Success is "success"', () =>
    expect(ResponseEmoji.Success).toBe("success"));
  it('Error is "error"', () => expect(ResponseEmoji.Error).toBe("error"));
  it('Point is "point"', () => expect(ResponseEmoji.Point).toBe("point"));
  it('Billboard is "billboard"', () =>
    expect(ResponseEmoji.Billboard).toBe("billboard"));
  it('Label is "label"', () => expect(ResponseEmoji.Label).toBe("label"));
  it('Model is "model"', () => expect(ResponseEmoji.Model).toBe("model"));
  it('Polygon is "polygon"', () =>
    expect(ResponseEmoji.Polygon).toBe("polygon"));
  it('Polyline is "polyline"', () =>
    expect(ResponseEmoji.Polyline).toBe("polyline"));
  it('Box is "box"', () => expect(ResponseEmoji.Box).toBe("box"));
  it('Corridor is "corridor"', () =>
    expect(ResponseEmoji.Corridor).toBe("corridor"));
  it('Cylinder is "cylinder"', () =>
    expect(ResponseEmoji.Cylinder).toBe("cylinder"));
  it('Ellipse is "ellipse"', () =>
    expect(ResponseEmoji.Ellipse).toBe("ellipse"));
  it('Rectangle is "rectangle"', () =>
    expect(ResponseEmoji.Rectangle).toBe("rectangle"));
  it('Wall is "wall"', () => expect(ResponseEmoji.Wall).toBe("wall"));
  it('Animation is "animation"', () =>
    expect(ResponseEmoji.Animation).toBe("animation"));
  it('Play is "play"', () => expect(ResponseEmoji.Play).toBe("play"));
  it('Pause is "pause"', () => expect(ResponseEmoji.Pause).toBe("pause"));
  it('Info is "info"', () => expect(ResponseEmoji.Info).toBe("info"));
});

// ---------------------------------------------------------------------------
describe("RESPONSE_EMOJIS map", () => {
  it("has an entry for every ResponseEmoji member", () => {
    // Collect all string values of the enum (TS string enums have only string values)
    const enumValues = Object.values(ResponseEmoji);
    for (const value of enumValues) {
      expect(RESPONSE_EMOJIS).toHaveProperty(value);
    }
  });

  it("maps Success to ✅", () =>
    expect(RESPONSE_EMOJIS[ResponseEmoji.Success]).toBe("✅"));
  it("maps Error to ❌", () =>
    expect(RESPONSE_EMOJIS[ResponseEmoji.Error]).toBe("❌"));
  it("maps Point to 📍", () =>
    expect(RESPONSE_EMOJIS[ResponseEmoji.Point]).toBe("📍"));
  it("maps Animation to 🎬", () =>
    expect(RESPONSE_EMOJIS[ResponseEmoji.Animation]).toBe("🎬"));

  it("all emoji values are non-empty strings", () => {
    for (const emoji of Object.values(RESPONSE_EMOJIS)) {
      expect(typeof emoji).toBe("string");
      expect(emoji.length).toBeGreaterThan(0);
    }
  });
});
