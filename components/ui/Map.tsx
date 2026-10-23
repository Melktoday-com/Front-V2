"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AdSummary } from "@/types/api/ads.types";
import { ZoneSummary } from "@/types/api/geo.types";
import { MapClusterDto, MapMarkerDto } from "@/types/api/search.types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { PropertyCard } from "./PropertyCard";
import { getMediaPosterUrl } from "@/lib/utils";
import { mapMarkerToLocation } from "@/lib/location";

// Use local self-hosted marker icons to eliminate external CDN network requests
const DefaultIcon = L.icon({
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function getMapAdPricing(pricing?: Record<string, number | boolean | string> | null): { price: string | number; unit?: string } {
    if (!pricing || Object.keys(pricing).length === 0) return { price: "توافقی" };
    if (pricing.depositPrice !== undefined && pricing.monthlyRent !== undefined) {
        return {
            price: `رهن ${Number(pricing.depositPrice).toLocaleString('fa-IR')} - اجاره ${Number(pricing.monthlyRent).toLocaleString('fa-IR')}`,
            unit: "تومان",
        };
    }
    if (pricing.totalPrice !== undefined) {
        const total = Number(pricing.totalPrice);
        return { price: total > 0 ? total : "توافقی", unit: total > 0 ? "تومان" : undefined };
    }
    if (pricing.depositPrice !== undefined) {
        const dep = Number(pricing.depositPrice);
        return { price: dep > 0 ? `ودیعه ${dep.toLocaleString('fa-IR')}` : "توافقی", unit: dep > 0 ? "تومان" : undefined };
    }
    if (pricing.monthlyRent !== undefined) {
        const rent = Number(pricing.monthlyRent);
        return { price: rent > 0 ? `اجاره ${rent.toLocaleString('fa-IR')}` : "توافقی", unit: rent > 0 ? "تومان" : undefined };
    }
    if (pricing.estimatedTotalPrice !== undefined) {
        const est = Number(pricing.estimatedTotalPrice);
        return { price: est > 0 ? est : "توافقی", unit: est > 0 ? "تومان" : undefined };
    }
    if (pricing.goodwillPrice !== undefined) {
        const gw = Number(pricing.goodwillPrice);
        return { price: gw > 0 ? gw : "توافقی", unit: gw > 0 ? "تومان" : undefined };
    }
    if (pricing.fractionPrice !== undefined) {
        const fp = Number(pricing.fractionPrice);
        return { price: fp > 0 ? fp : "توافقی", unit: fp > 0 ? "تومان" : undefined };
    }
    return { price: "توافقی" };
}

// In-memory cache for created divIcons to avoid recreating L.divIcon on every render
const priceIconCache = new globalThis.Map<string, L.DivIcon>();

function getPriceIcon(price: string): L.DivIcon {
    let icon = priceIconCache.get(price);
    if (!icon) {
        icon = L.divIcon({
            className: 'price-tag-icon',
            html: `
                <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full pointer-events-auto">
                    <div class="bg-brand text-white px-2 py-1 rounded-full shadow-lg border-2 border-white text-[10px] font-black whitespace-nowrap mb-0.5 hover:scale-110 transition-transform duration-200">
                        ${price}
                    </div>
                    <div class="w-2 h-2 bg-brand rounded-full border border-white shadow-sm"></div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
        });
        priceIconCache.set(price, icon);
    }
    return icon;
}

const clusterIconCache = new globalThis.Map<number, L.DivIcon>();

function getClusterIcon(count: number): L.DivIcon {
    let icon = clusterIconCache.get(count);
    if (!icon) {
        const size = count < 10 ? 38 : count < 100 ? 46 : 54;
        icon = L.divIcon({
            className: 'custom-cluster-icon',
            html: `
                <div class="transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                    <div style="width: ${size}px; height: ${size}px;" 
                         class="flex items-center justify-center rounded-full bg-brand/90 hover:bg-brand text-white font-black text-xs sm:text-sm shadow-xl border-2 border-white cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95">
                        <span>${count.toLocaleString('fa-IR')}</span>
                    </div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
        });
        clusterIconCache.set(count, icon);
    }
    return icon;
}

const ClusterMarker = React.memo(function ClusterMarker({ cluster }: { cluster: MapClusterDto }) {
    const map = useMap();
    const icon = useMemo(() => getClusterIcon(cluster.count), [cluster.count]);

    const handleClick = () => {
        if (
            cluster.bounds &&
            (cluster.bounds.northEast.lat !== cluster.bounds.southWest.lat ||
             cluster.bounds.northEast.lng !== cluster.bounds.southWest.lng)
        ) {
            map.fitBounds(
                [
                    [cluster.bounds.southWest.lat, cluster.bounds.southWest.lng],
                    [cluster.bounds.northEast.lat, cluster.bounds.northEast.lng],
                ],
                { padding: [50, 50], animate: true }
            );
        } else {
            map.setView(
                [cluster.latitude, cluster.longitude],
                cluster.expansionZoom || Math.min(17, map.getZoom() + 2),
                { animate: true }
            );
        }
    };

    return (
        <Marker
            position={[cluster.latitude, cluster.longitude]}
            icon={icon}
            eventHandlers={{
                click: handleClick,
            }}
        />
    );
});

const PriceMarker = React.memo(function PriceMarker({ marker }: { marker: MapMarkerDto }) {
    const price = marker.price;
    const priceLabel = useMemo(() => {
        if (!price) return "توافقی";
        if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} میلیارد`;
        if (price >= 1000000) return `${(price / 1000000).toFixed(0)} میلیون`;
        return price.toLocaleString('fa-IR');
    }, [price]);

    const icon = useMemo(() => getPriceIcon(priceLabel), [priceLabel]);

    return (
        <Marker
            position={[marker.latitude, marker.longitude]}
            icon={icon}
        >
            <Popup
                className="property-popup"
                offset={[0, -24]}
                maxWidth={320}
                minWidth={275}
            >
                <PropertyCard
                    adId={marker.id}
                    variant="map"
                    title={marker.title}
                    price={marker.price ?? "توافقی"}
                    location={mapMarkerToLocation(marker)}
                    image={getMediaPosterUrl(marker.mediaIds?.[0])}
                    isVideo={marker.mediaIds?.[0]?.type === "VIDEO"}
                    category={marker.subcategory || marker.category || ''}
                />
            </Popup>
        </Marker>
    );
});

const LegacyAdMarker = React.memo(function LegacyAdMarker({
    ad,
}: {
    ad: AdSummary & { location: NonNullable<AdSummary['location']> };
}) {
    const priceInfo = getMapAdPricing(ad.pricing);
    const numericPrice = typeof priceInfo.price === "number" ? priceInfo.price : undefined;
    const priceLabel = useMemo(() => {
        if (numericPrice) {
            if (numericPrice >= 1000000000) return `${(numericPrice / 1000000000).toFixed(1)} میلیارد`;
            if (numericPrice >= 1000000) return `${(numericPrice / 1000000).toFixed(0)} میلیون`;
            return numericPrice.toLocaleString('fa-IR');
        }
        return priceInfo.price ? String(priceInfo.price) : "توافقی";
    }, [numericPrice, priceInfo.price]);

    const icon = useMemo(() => getPriceIcon(priceLabel), [priceLabel]);

    return (
        <Marker
            position={[ad.location.coordinates!.latitude, ad.location.coordinates!.longitude]}
            icon={icon}
        >
            <Popup
                className="property-popup"
                offset={[0, -24]}
                maxWidth={320}
                minWidth={275}
            >
                <PropertyCard
                    adId={ad.adId}
                    variant="map"
                    title={ad.title}
                    price={numericPrice ?? priceInfo.price ?? "توافقی"}
                    unit={priceInfo.unit}
                    location={ad.location}
                    image={getMediaPosterUrl(ad.mediaIds?.[0])}
                    isVideo={ad.mediaIds?.[0]?.type === "VIDEO"}
                    category={ad.subcategoryTitle || ad.categoryPath?.subcategoryTitle || ad.categoryPath?.subcategoryKey}
                />
            </Popup>
        </Marker>
    );
});

function MapViewHandler({ center, zoom, bounds }: { center: [number, number]; zoom: number; bounds?: L.LatLngBoundsExpression }) {
    const map = useMap();
    const prevCenterRef = useRef<[number, number] | null>(null);
    const prevZoomRef = useRef<number | null>(null);

    useEffect(() => {
        const size = map.getSize();
        const hasValidSize = Boolean(size && size.x > 0 && size.y > 0);

        if (bounds) {
            if (hasValidSize) {
                map.fitBounds(bounds, { padding: [50, 50], animate: true });
            }
            return;
        }

        // Validate center coordinates
        if (!Array.isArray(center) || center.length !== 2 || isNaN(center[0]) || isNaN(center[1])) {
            return;
        }

        const prevCenter = prevCenterRef.current;
        const centerChanged =
            !prevCenter ||
            Math.abs(prevCenter[0] - center[0]) > 0.0005 ||
            Math.abs(prevCenter[1] - center[1]) > 0.0005;

        const zoomChanged = prevZoomRef.current !== null && prevZoomRef.current !== zoom;

        if (centerChanged || zoomChanged) {
            prevCenterRef.current = center;
            prevZoomRef.current = zoom;

            // Only use flyTo if map has valid non-zero dimensions
            if (hasValidSize) {
                try {
                    map.flyTo(center, zoom, {
                        duration: 1.0,
                        easeLinearity: 0.25,
                    });
                } catch {
                    map.setView(center, zoom);
                }
            } else {
                map.setView(center, zoom);
            }
        }
    }, [center, zoom, bounds, map]);

    // When the map container transitions from hidden to visible, recalculate size via ResizeObserver
    useEffect(() => {
        const container = map.getContainer();
        if (!container || typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver(() => {
            const size = map.getSize();
            if (size.x > 0 && size.y > 0) {
                map.invalidateSize({ pan: false });
                if (prevCenterRef.current) {
                    map.setView(prevCenterRef.current, prevZoomRef.current || zoom);
                }
            }
        });

        observer.observe(container);
        if (container.parentElement) {
            observer.observe(container.parentElement);
        }
        return () => observer.disconnect();
    }, [map, zoom]);

    return null;
}

function MapEventsHandler({
    onViewportChange,
    onBoundsChange,
}: {
    onViewportChange?: (viewport: {
        bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } };
        zoom: number;
    }) => void;
    onBoundsChange?: (bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } }) => void;
}) {
    const map = useMap();
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!onViewportChange && !onBoundsChange) return;

        const handleMoveEnd = () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                const b = map.getBounds();
                const z = map.getZoom();
                const bounds = {
                    northEast: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
                    southWest: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
                };
                if (onViewportChange) {
                    onViewportChange({ bounds, zoom: z });
                }
                if (onBoundsChange) {
                    onBoundsChange(bounds);
                }
            }, 250);
        };

        map.on('moveend', handleMoveEnd);
        return () => {
            map.off('moveend', handleMoveEnd);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [map, onViewportChange, onBoundsChange]);

    return null;
}

interface MapProps {
    ads?: AdSummary[];
    markers?: MapMarkerDto[];
    clusters?: MapClusterDto[];
    zones?: ZoneSummary[];
    selectedZoneId?: string;
    selectedZoneIds?: string[];
    onZoneSelect?: (zone: ZoneSummary) => void;
    center?: [number, number];
    zoom?: number;
    bounds?: L.LatLngBoundsExpression;
    onViewportChange?: (viewport: {
        bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } };
        zoom: number;
    }) => void;
    onBoundsChange?: (bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } }) => void;
}

export default function Map({
    ads = [],
    markers,
    clusters,
    zones,
    selectedZoneId,
    selectedZoneIds,
    onZoneSelect,
    center = [35.6892, 51.3890],
    zoom = 12,
    bounds,
    onViewportChange,
    onBoundsChange,
}: MapProps) {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia("(max-width: 1023px)");
        setIsMobile(mql.matches);
        const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener("change", listener);
        return () => mql.removeEventListener("change", listener);
    }, []);

    // Sanitize center - if it contains undefined/NaN or isn't a valid pair, use default
    const sanitizedCenter: [number, number] = (
        Array.isArray(center) &&
        center.length === 2 &&
        typeof center[0] === 'number' &&
        !isNaN(center[0]) &&
        typeof center[1] === 'number' &&
        !isNaN(center[1])
    ) ? center : [35.6892, 51.3890];

    // If there are ads with locations, we might want to fit the bounds
    const adsWithLocation = useMemo(() => {
        return ads.filter((ad): ad is typeof ad & { location: NonNullable<typeof ad.location> } =>
            Boolean(
                ad.location?.coordinates &&
                typeof ad.location.coordinates.latitude === 'number' &&
                !isNaN(ad.location.coordinates.latitude) &&
                typeof ad.location.coordinates.longitude === 'number' &&
                !isNaN(ad.location.coordinates.longitude)
            )
        );
    }, [ads]);

    return (
        <div className="relative w-full h-full rounded-[25px] overflow-hidden border border-soft-bg shadow-sm z-0">
            <MapContainer
                center={sanitizedCenter}
                zoom={zoom}
                scrollWheelZoom={true}
                attributionControl={false}
                className="w-full h-full"
            >
                <TileLayer
                    url="/api/tiles/{z}/{x}/{y}.png"
                    maxZoom={17}
                    keepBuffer={isMobile ? 2 : 3}
                    updateWhenIdle={isMobile}
                    updateInterval={150}
                />
                <MapViewHandler center={sanitizedCenter} zoom={zoom} bounds={bounds} />
                <MapEventsHandler onViewportChange={onViewportChange} onBoundsChange={onBoundsChange} />

                {/* Render Zone / Neighborhood Polygons */}
                {zones?.map((zone) => {
                    const coords = zone.boundaries?.coordinates;
                    if (!coords || !Array.isArray(coords) || coords.length === 0) return null;

                    let positions: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][] = [];

                    if (zone.boundaries?.type === "Polygon") {
                        const rings = (coords as number[][][])
                            .map((ring) =>
                                ring
                                    .filter((pt) => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1]))
                                    .map(([lng, lat]) => [lat, lng] as [number, number])
                            )
                            .filter((ring) => ring.length >= 3);

                        if (rings.length === 0) return null;
                        positions = rings;
                    } else if (zone.boundaries?.type === "MultiPolygon") {
                        const polygons = (coords as number[][][][])
                            .map((poly) =>
                                poly
                                    .map((ring) =>
                                        ring
                                            .filter((pt) => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1]))
                                            .map(([lng, lat]) => [lat, lng] as [number, number])
                                    )
                                    .filter((ring) => ring.length >= 3)
                            )
                            .filter((poly) => poly.length > 0);

                        if (polygons.length === 0) return null;
                        positions = polygons;
                    } else {
                        return null;
                    }

                    const isSelected = selectedZoneId === zone.id || (Boolean(selectedZoneIds) && selectedZoneIds!.includes(zone.id));

                    return (
                        <Polygon
                            key={zone.id}
                            positions={positions}
                            pathOptions={{
                                color: isSelected ? "var(--color-primary)" : "var(--color-border-strong)",
                                fillColor: isSelected ? "var(--color-primary)" : "var(--color-brand-beige)",
                                fillOpacity: isSelected ? 0.45 : 0.07,
                                opacity: isSelected ? 1 : 0.85,
                                weight: isSelected ? 3.5 : 1.2,
                                dashArray: isSelected ? undefined : "4, 4",
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (onZoneSelect) {
                                        onZoneSelect(zone);
                                    }
                                },
                                mouseover: (e) => {
                                    if (!isSelected) {
                                        const layer = e.target;
                                        layer.setStyle({
                                            fillOpacity: 0.22,
                                            opacity: 1,
                                            weight: 2.2,
                                            color: "var(--color-primary-hover)",
                                        });
                                    }
                                },
                                mouseout: (e) => {
                                    if (!isSelected) {
                                        const layer = e.target;
                                        layer.setStyle({
                                            fillOpacity: 0.07,
                                            opacity: 0.85,
                                            weight: 1.2,
                                            color: "var(--color-border-strong)",
                                        });
                                    }
                                },
                            }}
                        >
                            <Tooltip
                                sticky
                                direction="center"
                                className={
                                    isSelected
                                        ? "font-black text-xs bg-primary text-white border-none px-3 py-1.5 rounded-lg shadow-lg"
                                        : "font-bold text-xs bg-surface/95 text-foreground-secondary border border-border-subtle px-2.5 py-1 rounded-md shadow-md"
                                }
                            >
                                {zone.name}
                            </Tooltip>
                        </Polygon>
                    );
                })}

                {/* Render Adaptive Clusters */}
                {clusters?.map((cluster) => (
                    <ClusterMarker key={cluster.id} cluster={cluster} />
                ))}

                {/* Render Individual Markers (if provided) */}
                {markers && markers.length > 0 ? (
                    markers.map((marker) => (
                        <PriceMarker key={marker.id} marker={marker} />
                    ))
                ) : (
                    /* Fallback to legacy ads list if markers not provided */
                    adsWithLocation.map((ad) => (
                        <LegacyAdMarker key={ad.adId} ad={ad} />
                    ))
                )}
            </MapContainer>
        </div>
    );
}
