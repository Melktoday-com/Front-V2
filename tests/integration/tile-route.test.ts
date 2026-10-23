import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import http from "http";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { processTileRequest } from "@/lib/tile-cache/tile-service";
import { MemoryTileCache } from "@/lib/tile-cache/memory-cache";
import { TileRateLimiter } from "@/lib/tile-cache/rate-limiter";
import { UpstreamFetcher } from "@/lib/tile-cache/upstream-fetcher";
import { TileProxyConfig } from "@/lib/tile-cache/config";

describe("Tile Route Handler Integration (with Mock Upstream Server)", () => {
  let mockServer: http.Server;
  let mockServerPort: number;
  let upstreamRequests: Array<{ url: string; headers: http.IncomingHttpHeaders }> = [];
  let mockHandler: (req: http.IncomingMessage, res: http.ServerResponse) => void;

  let tempCacheDir: string;
  let testConfig: TileProxyConfig;
  let memoryCache: MemoryTileCache;
  let rateLimiter: TileRateLimiter;
  let upstreamFetcher: UpstreamFetcher;

  const sampleTilePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );

  beforeAll(async () => {
    mockServer = http.createServer((req, res) => {
      upstreamRequests.push({ url: req.url || "", headers: req.headers });
      if (mockHandler) {
        mockHandler(req, res);
      } else {
        res.writeHead(200, {
          "Content-Type": "image/png",
          ETag: '"mock-etag-1"',
        });
        res.end(sampleTilePng);
      }
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, "127.0.0.1", () => {
        const addr = mockServer.address();
        if (addr && typeof addr === "object") {
          mockServerPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  beforeEach(async () => {
    upstreamRequests = [];
    tempCacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "tile-route-test-"));

    testConfig = {
      upstreamUrl: `http://127.0.0.1:${mockServerPort}/{z}/{x}/{y}.png`,
      userAgent: "TestTileProxy/1.0",
      cacheDir: tempCacheDir,
      ttlDays: 30,
      cacheMaxGb: 1,
      maxZoom: 17,
      upstreamConcurrency: 6,
      memCacheMaxMb: 16,
      rateLimitBurst: 500,
      rateLimitRefill: 100,
    };

    memoryCache = new MemoryTileCache(16);
    rateLimiter = new TileRateLimiter(500, 100);
    upstreamFetcher = new UpstreamFetcher(testConfig);

    // Default mock handler: return sample tile
    mockHandler = (req, res) => {
      if (req.headers["if-none-match"] === '"mock-etag-1"') {
        res.writeHead(304);
        res.end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": "image/png",
        ETag: '"mock-etag-1"',
      });
      res.end(sampleTilePng);
    };
  });

  afterEach(async () => {
    await fs.rm(tempCacheDir, { recursive: true, force: true }).catch(() => {});
  });

  it("Layer 1/2/3: MISS -> HIT-MEM -> HIT-DISK", async () => {
    const headers = new Headers();

    // 1st request: Cache MISS -> Upstream fetch
    const res1 = await processTileRequest("12", "100", "200", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res1.status).toBe(200);
    expect(res1.headers.get("X-Tile-Cache")).toBe("MISS");
    expect(res1.headers.get("Content-Type")).toBe("image/png");
    expect(res1.headers.get("ETag")).toBe('"mock-etag-1"');
    expect(upstreamRequests.length).toBe(1);

    // 2nd request: Memory cache HIT-MEM
    const res2 = await processTileRequest("12", "100", "200", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res2.status).toBe(200);
    expect(res2.headers.get("X-Tile-Cache")).toBe("HIT-MEM");
    expect(upstreamRequests.length).toBe(1); // No new upstream request

    // 3rd request: Clear memory cache -> Disk cache HIT-DISK
    memoryCache.clear();
    const res3 = await processTileRequest("12", "100", "200", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res3.status).toBe(200);
    expect(res3.headers.get("X-Tile-Cache")).toBe("HIT-DISK");
    expect(upstreamRequests.length).toBe(1); // Still no new upstream request
  });

  it("handles client If-None-Match with 304 Not Modified", async () => {
    const headers = new Headers();
    // Preload into memory
    await processTileRequest("12", "100", "200", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    const headersWithEtag = new Headers({
      "if-none-match": '"mock-etag-1"',
    });

    const res304 = await processTileRequest("12", "100", "200", headersWithEtag, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res304.status).toBe(304);
  });

  it("coalesces concurrent requests for identical tile to exactly ONE upstream call", async () => {
    // Add artificial delay to mock server
    mockHandler = (req, res) => {
      setTimeout(() => {
        res.writeHead(200, {
          "Content-Type": "image/png",
          ETag: '"coalesced-etag"',
        });
        res.end(sampleTilePng);
      }, 50);
    };

    const headers = new Headers();

    // Fire 10 concurrent requests for the exact same tile
    const promises = Array.from({ length: 10 }).map(() =>
      processTileRequest("12", "555", "777", headers, {
        config: testConfig,
        memoryCache,
        rateLimiter,
        upstreamFetcher,
      })
    );

    const responses = await Promise.all(promises);

    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    // Must trigger exactly 1 upstream request!
    expect(upstreamRequests.length).toBe(1);
  });

  it("handles Stale-While-Revalidate when disk tile exceeds TTL", async () => {
    const staleTime = Date.now() - 35 * 24 * 60 * 60 * 1000; // 35 days old (TTL = 30)
    // Manually write stale tile to disk
    const diskPath = path.join(tempCacheDir, "12", "123", "456.png");
    const metaPath = path.join(tempCacheDir, "12", "123", "456.json");
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, sampleTilePng);
    await fs.writeFile(
      metaPath,
      JSON.stringify({ etag: '"old-etag"', fetchedAt: staleTime, contentType: "image/png" })
    );

    let revalidationCalled = false;
    mockHandler = (req, res) => {
      revalidationCalled = true;
      if (req.headers["if-none-match"] === '"old-etag"') {
        res.writeHead(304);
        res.end();
      } else {
        res.writeHead(200, { ETag: '"new-etag"' });
        res.end(sampleTilePng);
      }
    };

    const headers = new Headers();
    const res = await processTileRequest("12", "123", "456", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    // Should immediately serve STALE
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Tile-Cache")).toBe("STALE");

    // Wait a brief moment for background revalidation
    await new Promise((r) => setTimeout(r, 80));
    expect(revalidationCalled).toBe(true);
  });

  it("handles Stale-If-Error when upstream is down or 500", async () => {
    const staleTime = Date.now() - 35 * 24 * 60 * 60 * 1000;
    const diskPath = path.join(tempCacheDir, "12", "888", "999.png");
    const metaPath = path.join(tempCacheDir, "12", "888", "999.json");
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, sampleTilePng);
    await fs.writeFile(
      metaPath,
      JSON.stringify({ etag: '"stale-etag"', fetchedAt: staleTime, contentType: "image/png" })
    );

    // Mock server returns 500 Internal Error
    mockHandler = (req, res) => {
      res.writeHead(500);
      res.end("Internal Server Error");
    };

    const headers = new Headers();
    const res = await processTileRequest("12", "888", "999", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    // Returns stale tile rather than crashing or showing error
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Tile-Cache")).toBe("STALE");
  });

  it("handles upstream 404 with negative cache and transparent fallback", async () => {
    mockHandler = (req, res) => {
      res.writeHead(404);
      res.end("Not Found");
    };

    const headers = new Headers();
    const res1 = await processTileRequest("12", "404", "404", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res1.status).toBe(200);
    expect(res1.headers.get("X-Tile-Fallback")).toBe("404");

    // Subsequent request should hit negative cache directly without upstream call
    upstreamRequests = [];
    const res2 = await processTileRequest("12", "404", "404", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res2.status).toBe(200);
    expect(res2.headers.get("X-Tile-Fallback")).toBe("404-negative");
    expect(upstreamRequests.length).toBe(0);
  });

  it("backs off on upstream 429", async () => {
    mockHandler = (req, res) => {
      res.writeHead(429);
      res.end("Too Many Requests");
    };

    const headers = new Headers();
    const res = await processTileRequest("12", "429", "429", headers, {
      config: testConfig,
      memoryCache,
      rateLimiter,
      upstreamFetcher,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Tile-Fallback")).toContain("upstream-429");
  });

  it("handles atomic writes under high concurrency without corrupted files", async () => {
    mockHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "image/png", ETag: '"concurrent-etag"' });
      res.end(sampleTilePng);
    };

    const headers = new Headers();
    // Fire 20 parallel requests across 5 unique tile keys
    const requests = [];
    for (let i = 0; i < 20; i++) {
      const tileId = i % 5;
      requests.push(
        processTileRequest("12", String(tileId), "10", headers, {
          config: testConfig,
          memoryCache,
          rateLimiter,
          upstreamFetcher,
        })
      );
    }

    const results = await Promise.all(requests);
    for (const r of results) {
      expect(r.status).toBe(200);
    }

    // Verify all 5 files on disk are completely valid
    for (let i = 0; i < 5; i++) {
      const filePath = path.join(tempCacheDir, "12", String(i), "10.png");
      const stat = await fs.stat(filePath);
      expect(stat.size).toBe(sampleTilePng.length);
    }
  });
});
