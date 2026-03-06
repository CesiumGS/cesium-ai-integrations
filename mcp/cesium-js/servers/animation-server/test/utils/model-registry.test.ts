import { describe, it, expect } from "vitest";
import {
  getModelUri,
  resolveModelUri,
  isValidModelPreset,
  getAvailablePresets,
  getModelEntry,
} from "../../src/utils/model-registry";
import { ModelPresetType } from "../../src/utils/types";

describe("getModelUri", () => {
  it("returns URI for cesium_man", () => {
    const uri = getModelUri("cesium_man");
    expect(uri).toContain("Cesium_Man.glb");
  });

  it("returns URI for cesium_air", () => {
    const uri = getModelUri("cesium_air");
    expect(uri).toContain("Cesium_Air.glb");
  });

  it("returns URI for ground_vehicle", () => {
    const uri = getModelUri("ground_vehicle");
    expect(uri).toContain("GroundVehicle.glb");
  });

  it("returns URI for cesium_drone", () => {
    const uri = getModelUri("cesium_drone");
    expect(uri).toContain("CesiumDrone.glb");
  });

  it("throws for unknown preset", () => {
    expect(() => getModelUri("unknown_model" as ModelPresetType)).toThrow(
      "Unknown model preset",
    );
  });
});

describe("resolveModelUri", () => {
  it("returns custom URI when provided", () => {
    const customUri = "https://example.com/mymodel.glb";
    expect(resolveModelUri(undefined, customUri)).toBe(customUri);
  });

  it("custom URI takes precedence over preset", () => {
    const customUri = "https://example.com/mymodel.glb";
    expect(resolveModelUri("cesium_man", customUri)).toBe(customUri);
  });

  it("returns preset URI when only preset is provided", () => {
    const uri = resolveModelUri("cesium_air");
    expect(uri).toContain("Cesium_Air.glb");
  });

  it("throws when neither preset nor customUri is provided", () => {
    expect(() => resolveModelUri()).toThrow(
      "Must provide either modelPreset or modelUri",
    );
  });

  it("throws when both are undefined", () => {
    expect(() => resolveModelUri(undefined, undefined)).toThrow();
  });
});

describe("isValidModelPreset", () => {
  it("returns true for valid presets", () => {
    expect(isValidModelPreset("cesium_man")).toBe(true);
    expect(isValidModelPreset("cesium_air")).toBe(true);
    expect(isValidModelPreset("ground_vehicle")).toBe(true);
    expect(isValidModelPreset("cesium_drone")).toBe(true);
    expect(isValidModelPreset("custom")).toBe(true);
  });

  it("returns false for invalid presets", () => {
    expect(isValidModelPreset("unknown")).toBe(false);
    expect(isValidModelPreset("")).toBe(false);
    expect(isValidModelPreset("CESIUM_MAN")).toBe(false);
  });
});

describe("getAvailablePresets", () => {
  it("returns an array of preset names", () => {
    const presets = getAvailablePresets();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThan(0);
  });

  it("includes all known presets", () => {
    const presets = getAvailablePresets();
    expect(presets).toContain("cesium_man");
    expect(presets).toContain("cesium_air");
    expect(presets).toContain("ground_vehicle");
    expect(presets).toContain("cesium_drone");
    expect(presets).toContain("custom");
  });
});

describe("getModelEntry", () => {
  it("returns entry with uri and description for cesium_man", () => {
    const entry = getModelEntry("cesium_man");
    expect(entry).toBeDefined();
    expect(entry?.uri).toContain("Cesium_Man.glb");
    expect(entry?.description).toBeTruthy();
  });

  it("returns entry with recommendedFor array", () => {
    const entry = getModelEntry("cesium_air");
    expect(entry?.recommendedFor).toContain("flying");
  });

  it("returns undefined for unknown preset", () => {
    const entry = getModelEntry("unknown_model" as ModelPresetType);
    expect(entry).toBeUndefined();
  });
});
