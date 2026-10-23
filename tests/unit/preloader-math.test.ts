import { describe, it, expect } from "vitest";
import {
  latLngToTile,
  computeSurroundingTiles,
} from "@/lib/map-preloader";

describe("Preloader tile calculation and math", () => {
  it("converts known city coordinates to correct OSM tile indices", () => {
    // Tehran: ~35.6892 N, 51.3890 E
    const tehranZ12 = latLngToTile(35.6892, 51.389, 12);
    expect(tehranZ12.x).toBeGreaterThan(2500);
    expect(tehranZ12.x).toBeLessThan(2700);
    expect(tehranZ12.y).toBeGreaterThan(1500);
    expect(tehranZ12.y).toBeLessThan(1700);

    // Zoom 13 should roughly double coordinate values
    const tehranZ13 = latLngToTile(35.6892, 51.389, 13);
    expect(Math.floor(tehranZ13.x / 2)).toBe(tehranZ12.x);
    expect(Math.floor(tehranZ13.y / 2)).toBe(tehranZ12.y);
  });

  it("computes surrounding 3x3 tiles per zoom level", () => {
    const tiles = computeSurroundingTiles(35.6892, 51.389, [12, 13], 1);
    // 3x3 at z=12 (9 tiles) + 3x3 at z=13 (9 tiles) = 18 tiles
    expect(tiles.length).toBe(18);

    const z12Tiles = tiles.filter((t) => t.z === 12);
    const z13Tiles = tiles.filter((t) => t.z === 13);
    expect(z12Tiles.length).toBe(9);
    expect(z13Tiles.length).toBe(9);
  });

  it("strictly enforces hard cap of maximum 36 tiles", () => {
    // With large radius 5, standard math would produce (11 * 11) * 2 = 242 tiles
    const cappedTiles = computeSurroundingTiles(35.6892, 51.389, [12, 13], 5);
    expect(cappedTiles.length).toBe(36);
  });
});
