"use client";

import { useCity } from "@/components/providers/CityProvider";
import { initMapTileServiceWorker, preloadCityMapTiles } from "@/lib/map-preloader";
import { useEffect } from "react";

// Default coordinate fallbacks for major cities (Tehran & Mashhad)
const FALLBACK_CITIES = [
    { name: "تهران", lat: 35.6892, lng: 51.3890 },
    { name: "مشهد", lat: 36.2972, lng: 59.6067 },
];

export function MapTileCacheInitializer() {
    const { selectedCity } = useCity();

    useEffect(() => {
        // 1. Register background tile-caching service worker
        initMapTileServiceWorker();

        // 2. Preload tiles for the active city in background idle time
        const lat = selectedCity?.centerPoint?.latitude;
        const lng = selectedCity?.centerPoint?.longitude;

        if (typeof lat === "number" && !isNaN(lat) && typeof lng === "number" && !isNaN(lng)) {
            preloadCityMapTiles(lat, lng, [12, 13]);
        } else {
            // Preload default popular cities (Tehran & Mashhad)
            FALLBACK_CITIES.forEach((c) => {
                preloadCityMapTiles(c.lat, c.lng, [12]);
            });
        }
    }, [selectedCity?.id, selectedCity?.centerPoint?.latitude, selectedCity?.centerPoint?.longitude]);

    return null;
}
