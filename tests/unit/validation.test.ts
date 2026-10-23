import { describe, it, expect } from "vitest";
import { validateTileParams } from "@/lib/tile-cache/validation";

describe("validateTileParams", () => {
  it("accepts valid coordinates within zoom limit", () => {
    const valid = validateTileParams("12", "2632", "1638", 17);
    expect(valid).toEqual({
      z: 12,
      x: 2632,
      y: 1638,
      key: "12/2632/1638",
    });
  });

  it("strips optional .png extension from y", () => {
    const valid = validateTileParams("13", "5264", "3276.png", 17);
    expect(valid).toEqual({
      z: 13,
      x: 5264,
      y: 3276,
      key: "13/5264/3276",
    });
  });

  it("handles zoom level 0 correctly", () => {
    const valid = validateTileParams("0", "0", "0", 17);
    expect(valid).toEqual({
      z: 0,
      x: 0,
      y: 0,
      key: "0/0/0",
    });
  });

  it("rejects coordinates outside 2^z range", () => {
    // at z=2, coords must be 0 <= x,y < 4
    expect(validateTileParams("2", "4", "0", 17)).toBeNull();
    expect(validateTileParams("2", "0", "4", 17)).toBeNull();
    expect(validateTileParams("2", "3", "3", 17)).not.toBeNull();
  });

  it("rejects zoom levels exceeding maxZoom", () => {
    expect(validateTileParams("18", "100", "100", 17)).toBeNull();
    expect(validateTileParams("17", "100", "100", 17)).not.toBeNull();
  });

  it("rejects negative coordinates", () => {
    expect(validateTileParams("-1", "0", "0", 17)).toBeNull();
    expect(validateTileParams("12", "-5", "10", 17)).toBeNull();
    expect(validateTileParams("12", "10", "-5", 17)).toBeNull();
  });

  it("rejects floating point or non-integer values", () => {
    expect(validateTileParams("12.5", "10", "10", 17)).toBeNull();
    expect(validateTileParams("12", "10.2", "10", 17)).toBeNull();
    expect(validateTileParams("12", "10", "10.8", 17)).toBeNull();
    expect(validateTileParams("NaN", "10", "10", 17)).toBeNull();
    expect(validateTileParams("12", "undefined", "10", 17)).toBeNull();
    expect(validateTileParams("12", "1e5", "10", 17)).toBeNull();
  });

  it("rejects path traversal attempts strictly", () => {
    expect(validateTileParams("..", "10", "10", 17)).toBeNull();
    expect(validateTileParams("12", "../10", "10", 17)).toBeNull();
    expect(validateTileParams("12", "10", "../10", 17)).toBeNull();
    expect(validateTileParams("12", "10", "10/../../etc", 17)).toBeNull();
    expect(validateTileParams("12", "10\\windows", "10", 17)).toBeNull();
  });

  it("rejects huge numbers exceeding safe bounds", () => {
    expect(validateTileParams("1000", "9999999999999999999", "10", 17)).toBeNull();
  });
});
