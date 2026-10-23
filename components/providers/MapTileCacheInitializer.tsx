"use client";

import { useCity } from "@/components/providers/CityProvider";
import { initMapTileServiceWorker, preloadCityMapTiles } from "@/lib/map-preloader";
import { useEffect } from "react";

export function MapTileCacheInitializer() {
  const { selectedCity } = useCity();

  useEffect(() => {
    // 1. Register background tile-caching service worker once
    initMapTileServiceWorker();
  }, []);

  useEffect(() => {
    const lat = selectedCity?.centerPoint?.latitude;
    const lng = selectedCity?.centerPoint?.longitude;
    const cityId = selectedCity?.id;

    if (!cityId || typeof lat !== "number" || isNaN(lat) || typeof lng !== "number" || isNaN(lng)) {
      return;
    }

    const abortController = new AbortController();
    let idleHandle: number | undefined;
    let timerHandle: NodeJS.Timeout | undefined;

    const startPreload = () => {
      preloadCityMapTiles(cityId, lat, lng, [12, 13], abortController.signal).catch(() => {});
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleHandle = (window as any).requestIdleCallback(startPreload, { timeout: 3000 });
    } else {
      timerHandle = setTimeout(startPreload, 1500);
    }

    return () => {
      abortController.abort();
      if (idleHandle !== undefined && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timerHandle !== undefined) {
        clearTimeout(timerHandle);
      }
    };
  }, [selectedCity?.id, selectedCity?.centerPoint?.latitude, selectedCity?.centerPoint?.longitude]);

  return null;
}
