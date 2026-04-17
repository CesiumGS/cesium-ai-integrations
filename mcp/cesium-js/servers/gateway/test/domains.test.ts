import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ALL_DOMAINS,
  VALID_DOMAIN_NAMES,
  getEnabledDomains,
} from "../src/domains";

describe("domains", () => {
  describe("ALL_DOMAINS", () => {
    it("exposes the six expected domain definitions in a stable order", () => {
      expect(ALL_DOMAINS.map((d) => d.name)).toEqual([
        "camera",
        "entity",
        "animation",
        "imagery",
        "tiles",
        "terrain",
      ]);
    });

    it("every domain has a callable registerTools function", () => {
      for (const domain of ALL_DOMAINS) {
        expect(typeof domain.registerTools).toBe("function");
      }
    });
  });

  describe("VALID_DOMAIN_NAMES", () => {
    it("matches ALL_DOMAINS.name in order", () => {
      expect(VALID_DOMAIN_NAMES).toEqual(ALL_DOMAINS.map((d) => d.name));
    });
  });

  describe("getEnabledDomains", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it("returns ALL_DOMAINS when envValue is undefined", () => {
      expect(getEnabledDomains(undefined)).toEqual(ALL_DOMAINS);
    });

    it("returns ALL_DOMAINS when envValue is an empty string", () => {
      expect(getEnabledDomains("")).toEqual(ALL_DOMAINS);
    });

    it("returns ALL_DOMAINS when envValue is only whitespace", () => {
      expect(getEnabledDomains("   ")).toEqual(ALL_DOMAINS);
    });

    it("filters by a single domain name", () => {
      const result = getEnabledDomains("camera");
      expect(result.map((d) => d.name)).toEqual(["camera"]);
    });

    it("filters by a comma-separated list", () => {
      const result = getEnabledDomains("camera,entity,imagery");
      expect(result.map((d) => d.name)).toEqual([
        "camera",
        "entity",
        "imagery",
      ]);
    });

    it("is case-insensitive", () => {
      const result = getEnabledDomains("CAMERA, Entity");
      expect(result.map((d) => d.name)).toEqual(["camera", "entity"]);
    });

    it("trims whitespace around each name", () => {
      const result = getEnabledDomains(" camera ,  entity  ");
      expect(result.map((d) => d.name)).toEqual(["camera", "entity"]);
    });

    it("skips empty items between commas", () => {
      const result = getEnabledDomains("camera,,entity");
      expect(result.map((d) => d.name)).toEqual(["camera", "entity"]);
    });

    it("preserves the canonical ALL_DOMAINS order regardless of input order", () => {
      const result = getEnabledDomains("terrain,camera,imagery");
      expect(result.map((d) => d.name)).toEqual([
        "camera",
        "imagery",
        "terrain",
      ]);
    });

    it("warns when unknown domain names are requested but still returns the valid ones", () => {
      const result = getEnabledDomains("camera,bogus,entity");

      expect(result.map((d) => d.name)).toEqual(["camera", "entity"]);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain("bogus");
    });

    it("returns an empty list when none of the names match", () => {
      const result = getEnabledDomains("unknown1,unknown2");
      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
