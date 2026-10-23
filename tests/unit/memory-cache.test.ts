import { describe, it, expect, beforeEach } from "vitest";
import { MemoryTileCache } from "@/lib/tile-cache/memory-cache";

describe("MemoryTileCache", () => {
  let cache: MemoryTileCache;

  beforeEach(() => {
    // 1MB test cache
    cache = new MemoryTileCache(1, 1000);
  });

  it("stores and retrieves cached items", () => {
    const buf = Buffer.from("test-png-tile");
    cache.set("12/1/1", { buffer: buf, etag: '"test-etag"', fetchedAt: Date.now() });

    const retrieved = cache.get("12/1/1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.etag).toBe('"test-etag"');
    expect(retrieved?.buffer.toString()).toBe("test-png-tile");
  });

  it("evicts oldest items when byte limit is reached (LRU)", () => {
    // Total limit = 1MB. Let each item be 400KB
    const smallCache = new MemoryTileCache(1); // 1MB limit
    const item1 = Buffer.alloc(400 * 1024, "a");
    const item2 = Buffer.alloc(400 * 1024, "b");
    const item3 = Buffer.alloc(400 * 1024, "c");

    smallCache.set("tile-1", { buffer: item1, etag: '"e1"', fetchedAt: 1 });
    smallCache.set("tile-2", { buffer: item2, etag: '"e2"', fetchedAt: 2 });

    expect(smallCache.get("tile-1")).toBeDefined();
    expect(smallCache.get("tile-2")).toBeDefined();

    // Adding item 3 exceeds 1MB limit -> should evict tile-1
    smallCache.set("tile-3", { buffer: item3, etag: '"e3"', fetchedAt: 3 });

    expect(smallCache.get("tile-1")).toBeUndefined();
    expect(smallCache.get("tile-2")).toBeDefined();
    expect(smallCache.get("tile-3")).toBeDefined();
  });

  it("refreshes LRU order upon access", () => {
    const smallCache = new MemoryTileCache(1);
    const item1 = Buffer.alloc(400 * 1024, "a");
    const item2 = Buffer.alloc(400 * 1024, "b");
    const item3 = Buffer.alloc(400 * 1024, "c");

    smallCache.set("tile-1", { buffer: item1, etag: '"e1"', fetchedAt: 1 });
    smallCache.set("tile-2", { buffer: item2, etag: '"e2"', fetchedAt: 2 });

    // Access tile-1 to make it more recently used than tile-2
    smallCache.get("tile-1");

    // Adding item 3 should now evict tile-2, keeping tile-1
    smallCache.set("tile-3", { buffer: item3, etag: '"e3"', fetchedAt: 3 });

    expect(smallCache.get("tile-1")).toBeDefined();
    expect(smallCache.get("tile-2")).toBeUndefined();
    expect(smallCache.get("tile-3")).toBeDefined();
  });

  it("handles negative cache for 404s with TTL expiration", async () => {
    // 200ms TTL for negative cache
    const testCache = new MemoryTileCache(1, 200);

    testCache.setNegativeCache("12/999/999");
    expect(testCache.isNegativeCached("12/999/999")).toBe(true);
    expect(testCache.isNegativeCached("12/1/1")).toBe(false);

    // Wait for negative cache TTL to expire
    await new Promise((r) => setTimeout(r, 250));
    expect(testCache.isNegativeCached("12/999/999")).toBe(false);
  });
});
