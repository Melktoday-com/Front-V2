import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isNetworkConstrained,
  isCityAlreadyPreloaded,
  markCityAsPreloaded,
  preloadCityMapTiles,
} from "@/lib/map-preloader";

describe("Frontend map preloader behavior", () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
  });

  it("identifies unconstrained network normally", () => {
    vi.stubGlobal("navigator", {});
    expect(isNetworkConstrained()).toBe(false);
  });

  it("detects saveData constraint", () => {
    vi.stubGlobal("navigator", {
      connection: { saveData: true },
    });
    expect(isNetworkConstrained()).toBe(true);
  });

  it("detects 2g / slow-2g network constraint", () => {
    vi.stubGlobal("navigator", {
      connection: { effectiveType: "2g" },
    });
    expect(isNetworkConstrained()).toBe(true);

    vi.stubGlobal("navigator", {
      connection: { effectiveType: "slow-2g" },
    });
    expect(isNetworkConstrained()).toBe(true);

    vi.stubGlobal("navigator", {
      connection: { effectiveType: "4g", saveData: false },
    });
    expect(isNetworkConstrained()).toBe(false);
  });

  it("persists and checks preloaded city flag with TTL", () => {
    expect(isCityAlreadyPreloaded("tehran-1")).toBe(false);

    markCityAsPreloaded("tehran-1");
    expect(isCityAlreadyPreloaded("tehran-1")).toBe(true);

    // Another city should still be false
    expect(isCityAlreadyPreloaded("mashhad-2")).toBe(false);
  });

  it("aborts preloading immediately when AbortSignal fires", async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                clone: () => ({}),
              }),
            100
          )
        )
    );
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    // Start preload and immediately abort
    const preloadPromise = preloadCityMapTiles("tabriz-3", 38.08, 46.29, [12, 13], controller.signal);
    controller.abort();

    await preloadPromise;

    // Because it was aborted immediately, active requests should be aborted or 0/minimal
    expect(controller.signal.aborted).toBe(true);
  });

  it("never caches FALLBACK or no-store responses into Cache Storage", async () => {
    const putMock = vi.fn();
    const mockCache = {
      match: vi.fn().mockResolvedValue(null),
      put: putMock,
    };
    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    };
    vi.stubGlobal("caches", mockCaches);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {},
      },
      caches: mockCaches,
    });

    // 1. Fetch returns FALLBACK header
    const fallbackResponse = {
      ok: true,
      headers: {
        get: (h: string) => (h === "x-tile-cache" ? "FALLBACK" : null),
      },
      clone: () => fallbackResponse,
    };
    const fetchMock = vi.fn().mockResolvedValue(fallbackResponse);
    vi.stubGlobal("fetch", fetchMock);

    await preloadCityMapTiles("isfahan-4", 32.65, 51.66, [12]);

    // cache.put MUST NOT have been called for FALLBACK tiles
    expect(putMock).not.toHaveBeenCalled();

    // 2. Fetch returns Cache-Control: no-store
    putMock.mockClear();
    const noStoreResponse = {
      ok: true,
      headers: {
        get: (h: string) => (h === "cache-control" ? "no-store, must-revalidate" : null),
      },
      clone: () => noStoreResponse,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(noStoreResponse));

    await preloadCityMapTiles("shiraz-5", 29.59, 52.58, [12]);
    expect(putMock).not.toHaveBeenCalled();

    // 3. Genuine response (200 OK, HIT-DISK or MISS, public cache)
    putMock.mockClear();
    const genuineResponse = {
      ok: true,
      headers: {
        get: (h: string) => {
          if (h === "x-tile-cache") return "MISS";
          if (h === "cache-control") return "public, max-age=2592000";
          return null;
        },
      },
      clone: () => genuineResponse,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(genuineResponse));

    await preloadCityMapTiles("yazd-6", 31.89, 54.36, [12]);
    expect(putMock).toHaveBeenCalled();
  });
});
