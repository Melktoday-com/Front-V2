import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  writeDiskTile,
  readDiskTile,
  touchDiskTileMetadata,
  runDiskEviction,
} from "@/lib/tile-cache/disk-cache";

describe("Disk Tile Cache", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tile-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  });

  it("atomically writes tile and sidecar metadata, then reads it back", async () => {
    const tileBuffer = Buffer.from("fake-tile-data-12345");
    const etag = '"etag-test-123"';
    const fetchedAt = 1700000000000;

    await writeDiskTile(tempDir, 12, 10, 20, tileBuffer, etag, fetchedAt);

    const result = await readDiskTile(tempDir, 12, 10, 20);
    expect(result).not.toBeNull();
    expect(result?.buffer.equals(tileBuffer)).toBe(true);
    expect(result?.etag).toBe(etag);
    expect(result?.fetchedAt).toBe(fetchedAt);

    // Verify disk files exist
    const tilePath = path.join(tempDir, "12", "10", "20.png");
    const metaPath = path.join(tempDir, "12", "10", "20.json");
    expect(await fs.stat(tilePath)).toBeDefined();
    expect(await fs.stat(metaPath)).toBeDefined();
  });

  it("updates fetchedAt timestamp on touch", async () => {
    const tileBuffer = Buffer.from("fake-tile-data");
    await writeDiskTile(tempDir, 12, 10, 20, tileBuffer, '"etag-1"', 1000);

    const newTime = 50000;
    await touchDiskTileMetadata(tempDir, 12, 10, 20, newTime);

    const updated = await readDiskTile(tempDir, 12, 10, 20);
    expect(updated?.fetchedAt).toBe(newTime);
  });

  it("evicts oldest files first when cache exceeds maximum size", async () => {
    // Write 3 tiles of 100KB each with different timestamps
    const buf = Buffer.alloc(100 * 1024, "x");

    await writeDiskTile(tempDir, 12, 1, 1, buf, '"e1"', 1000); // oldest
    await writeDiskTile(tempDir, 12, 1, 2, buf, '"e2"', 2000); // middle
    await writeDiskTile(tempDir, 12, 1, 3, buf, '"e3"', 3000); // newest

    // Total = 300KB. Limit = 200KB (0.000190735 GB), target = 80% (160KB)
    // Should delete tile 1 and tile 2
    const maxGb = (200 * 1024) / (1024 * 1024 * 1024);
    const eviction = await runDiskEviction(tempDir, maxGb);

    expect(eviction.deletedFiles).toBeGreaterThanOrEqual(1);

    // Oldest tile (1/1) must be deleted
    const tile1 = await readDiskTile(tempDir, 12, 1, 1);
    expect(tile1).toBeNull();

    // Newest tile (1/3) should still exist
    const tile3 = await readDiskTile(tempDir, 12, 1, 3);
    expect(tile3).not.toBeNull();
  });
});
