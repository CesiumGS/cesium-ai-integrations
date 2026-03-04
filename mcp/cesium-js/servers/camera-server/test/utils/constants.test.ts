import { describe, it, expect } from "vitest";
import {
  DEFAULT_ORIENTATION,
  DEFAULT_LOOK_AT_OFFSET,
  DEFAULT_ORBIT_SPEED,
  TIMEOUT_BUFFER_MS,
} from "../../src/utils/constants";

describe("Camera Constants", () => {
  describe("DEFAULT_ORIENTATION", () => {
    it("should have correct heading value", () => {
      expect(DEFAULT_ORIENTATION.heading).toBe(0);
    });

    it("should have correct pitch value", () => {
      expect(DEFAULT_ORIENTATION.pitch).toBe(-15);
    });

    it("should have correct roll value", () => {
      expect(DEFAULT_ORIENTATION.roll).toBe(0);
    });

    it("should have all three orientation properties", () => {
      expect(Object.keys(DEFAULT_ORIENTATION)).toEqual([
        "heading",
        "pitch",
        "roll",
      ]);
    });
  });

  describe("DEFAULT_LOOK_AT_OFFSET", () => {
    it("should have correct heading value", () => {
      expect(DEFAULT_LOOK_AT_OFFSET.heading).toBe(0);
    });

    it("should have correct pitch value", () => {
      expect(DEFAULT_LOOK_AT_OFFSET.pitch).toBe(-90);
    });

    it("should have correct range value", () => {
      expect(DEFAULT_LOOK_AT_OFFSET.range).toBe(1000);
    });

    it("should have all three offset properties", () => {
      expect(Object.keys(DEFAULT_LOOK_AT_OFFSET)).toEqual([
        "heading",
        "pitch",
        "range",
      ]);
    });
  });

  describe("DEFAULT_ORBIT_SPEED", () => {
    it("should have correct value", () => {
      expect(DEFAULT_ORBIT_SPEED).toBe(0.005);
    });

    it("should be a positive number", () => {
      expect(DEFAULT_ORBIT_SPEED).toBeGreaterThan(0);
    });

    it("should be of type number", () => {
      expect(typeof DEFAULT_ORBIT_SPEED).toBe("number");
    });
  });

  describe("TIMEOUT_BUFFER_MS", () => {
    it("should have correct value", () => {
      expect(TIMEOUT_BUFFER_MS).toBe(2000);
    });

    it("should be a positive number", () => {
      expect(TIMEOUT_BUFFER_MS).toBeGreaterThan(0);
    });

    it("should be of type number", () => {
      expect(typeof TIMEOUT_BUFFER_MS).toBe("number");
    });

    it("should be in milliseconds (reasonable range)", () => {
      expect(TIMEOUT_BUFFER_MS).toBeGreaterThanOrEqual(1000);
      expect(TIMEOUT_BUFFER_MS).toBeLessThanOrEqual(10000);
    });
  });

  describe("Constant relationships", () => {
    it("should have DEFAULT_ORIENTATION pitch different from DEFAULT_LOOK_AT_OFFSET pitch", () => {
      expect(DEFAULT_ORIENTATION.pitch).not.toBe(DEFAULT_LOOK_AT_OFFSET.pitch);
    });

    it("should have matching heading values for both defaults", () => {
      expect(DEFAULT_ORIENTATION.heading).toBe(DEFAULT_LOOK_AT_OFFSET.heading);
    });

    it("should have DEFAULT_ORBIT_SPEED much smaller than TIMEOUT_BUFFER_MS", () => {
      expect(DEFAULT_ORBIT_SPEED).toBeLessThan(TIMEOUT_BUFFER_MS / 100);
    });
  });
});
