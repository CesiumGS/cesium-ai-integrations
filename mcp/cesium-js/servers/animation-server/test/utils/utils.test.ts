import { describe, it, expect } from "vitest";
import {
  parseDuration,
  decimateArray,
  getModelPresetFromTravelMode,
} from "../../src/utils/utils";

describe("parseDuration", () => {
  it("parses seconds", () => {
    expect(parseDuration("30 sec")).toBe(30000);
  });

  it("parses minutes", () => {
    expect(parseDuration("5 min")).toBe(300000);
  });

  it("parses hours", () => {
    expect(parseDuration("2 hour")).toBe(7200000);
  });

  it("is case-insensitive", () => {
    expect(parseDuration("10 SEC")).toBe(10000);
    expect(parseDuration("3 MIN")).toBe(180000);
    expect(parseDuration("1 HOUR")).toBe(3600000);
  });

  it("returns default 60000 for unrecognized format", () => {
    expect(parseDuration("invalid")).toBe(60000);
    expect(parseDuration("")).toBe(60000);
    expect(parseDuration("5 days")).toBe(60000);
  });
});

describe("decimateArray", () => {
  it("returns array unchanged when under max size", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(decimateArray(arr, 10)).toEqual(arr);
  });

  it("returns array unchanged when exactly at max size", () => {
    const arr = [1, 2, 3];
    expect(decimateArray(arr, 3)).toEqual(arr);
  });

  it("decimates array to max size", () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = decimateArray(arr, 10);
    expect(result).toHaveLength(10);
  });

  it("always preserves first element", () => {
    const arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = decimateArray(arr, 5);
    expect(result[0]).toBe(10);
  });

  it("always preserves last element", () => {
    const arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = decimateArray(arr, 5);
    expect(result[result.length - 1]).toBe(100);
  });

  it("uses MAX_POSITION_SAMPLES as default max size", () => {
    const arr = Array.from({ length: 10 }, (_, i) => i);
    // Array smaller than MAX_POSITION_SAMPLES (500) should be returned unchanged
    expect(decimateArray(arr)).toEqual(arr);
  });

  it("handles array of objects", () => {
    const arr = Array.from({ length: 20 }, (_, i) => ({ x: i }));
    const result = decimateArray(arr, 5);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ x: 0 });
    expect(result[result.length - 1]).toEqual({ x: 19 });
  });
});

describe("getModelPresetFromTravelMode", () => {
  it("returns cesium_man for walking", () => {
    expect(getModelPresetFromTravelMode("walking")).toBe("cesium_man");
  });

  it("returns ground_vehicle for driving", () => {
    expect(getModelPresetFromTravelMode("driving")).toBe("ground_vehicle");
  });

  it("returns cesium_man for cycling", () => {
    expect(getModelPresetFromTravelMode("cycling")).toBe("cesium_man");
  });

  it("returns cesium_man for bicycling", () => {
    expect(getModelPresetFromTravelMode("bicycling")).toBe("cesium_man");
  });

  it("returns ground_vehicle for transit", () => {
    expect(getModelPresetFromTravelMode("transit")).toBe("ground_vehicle");
  });

  it("returns cesium_air for flying", () => {
    expect(getModelPresetFromTravelMode("flying")).toBe("cesium_air");
  });

  it("returns undefined for unknown travel mode", () => {
    expect(getModelPresetFromTravelMode("swimming")).toBeUndefined();
  });

  it("returns undefined when no travel mode is provided", () => {
    expect(getModelPresetFromTravelMode()).toBeUndefined();
    expect(getModelPresetFromTravelMode(undefined)).toBeUndefined();
  });
});
