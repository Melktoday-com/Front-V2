import { describe, it, expect } from "vitest";

describe("Service Worker & Cache API Vary Handling", () => {
  it("matches tile response containing Next.js Vary header when ignoreVary is enabled", async () => {
    // Mock minimal Cache API behavior matching W3C Cache spec
    class MockCache {
      private entries: Map<string, { response: Response; varyHeaders: Record<string, string> }> = new Map();

      async put(request: Request | string, response: Response) {
        const url = typeof request === "string" ? request : request.url;
        const reqHeaders: Record<string, string> = {};
        if (typeof request !== "string") {
          request.headers.forEach((val, key) => {
            reqHeaders[key.toLowerCase()] = val;
          });
        }
        this.entries.set(url, { response, varyHeaders: reqHeaders });
      }

      async match(request: Request | string, options?: { ignoreVary?: boolean }): Promise<Response | undefined> {
        const url = typeof request === "string" ? request : request.url;
        const entry = this.entries.get(url);
        if (!entry) return undefined;

        if (options?.ignoreVary) {
          return entry.response.clone();
        }

        // If response has Vary, request headers must match stored vary headers
        const vary = entry.response.headers.get("vary");
        if (vary && typeof request !== "string") {
          const varyFields = vary.split(",").map((s) => s.trim().toLowerCase());
          for (const field of varyFields) {
            const reqVal = request.headers.get(field) || "";
            const storedVal = entry.varyHeaders[field] || "";
            if (reqVal !== storedVal) {
              return undefined; // Mismatch according to HTTP Vary specification
            }
          }
        }

        return entry.response.clone();
      }
    }

    const cache = new MockCache();
    const tileUrl = "http://localhost:3000/api/tiles/12/2632/1638.png";

    // 1. Tile stored by preloader or initial fetch with Next.js Vary header and rsc request header
    const initialRequest = new Request(tileUrl, {
      headers: {
        rsc: "1",
        accept: "text/x-component",
      },
    });
    const initialResponse = new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: {
        "content-type": "image/png",
        vary: "rsc, next-router-state-tree, next-router-prefetch",
      },
    });

    await cache.put(initialRequest, initialResponse);

    // 2. Browser subsequently requests tile with Leaflet (standard image request, no rsc header)
    const leafletRequest = new Request(tileUrl, {
      headers: {
        accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
      },
    });

    // 3. Without ignoreVary: match FAILS due to missing 'rsc' in request
    const matchWithoutIgnore = await cache.match(leafletRequest);
    expect(matchWithoutIgnore).toBeUndefined();

    // 4. With ignoreVary: true: match SUCCEEDS
    const matchWithIgnore = await cache.match(leafletRequest, { ignoreVary: true });
    expect(matchWithIgnore).toBeDefined();
    expect(matchWithIgnore?.status).toBe(200);
  });
});
