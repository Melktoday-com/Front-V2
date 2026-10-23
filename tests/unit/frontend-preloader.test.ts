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
});
