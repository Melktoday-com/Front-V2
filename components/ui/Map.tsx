"use client";

import { AdSummary } from "@/types/api/ads.types";
import { ZoneSummary } from "@/types/api/geo.types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { PropertyCard } from "./PropertyCard";
import { getMediaUrl, getMediaPosterUrl } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const createPriceIcon = (price: string) => L.divIcon({
    className: 'price-tag-icon',
    html: `
        <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
            <div class="bg-brand text-white px-2 py-1 rounded-full shadow-lg border-2 border-white text-[10px] font-black whitespace-nowrap mb-0.5 hover:scale-110 transition-transform duration-200">
                ${price}
            </div>
            <div class="w-2 h-2 bg-brand rounded-full border border-white shadow-sm"></div>
        </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
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

            // Only use flyTo if map has valid non-zero dimensions!
            // When hidden on mobile list view (display: none), flyTo produces NaN division in Leaflet
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

    // When the map container transitions from hidden to visible (e.g. user toggles to map on mobile), recalculate size
    useEffect(() => {
        const container = map.getContainer();
        if (!container || typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver(() => {
            const size = map.getSize();
            if (size.x > 0 && size.y > 0) {
                map.invalidateSize();
                if (prevCenterRef.current) {
                    map.setView(prevCenterRef.current, prevZoomRef.current || zoom);
                }
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [map, zoom]);

    return null;
}

interface MapProps {
    ads: AdSummary[];
    zones?: ZoneSummary[];
    selectedZoneId?: string;
    selectedZoneIds?: string[];
    onZoneSelect?: (zone: ZoneSummary) => void;
    center?: [number, number];
    zoom?: number;
    bounds?: L.LatLngBoundsExpression;
}

export default function Map({ ads, zones, selectedZoneId, selectedZoneIds, onZoneSelect, center = [35.6892, 51.3890], zoom = 12, bounds }: MapProps) {
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
    const adsWithLocation = ads.filter((ad): ad is typeof ad & { location: NonNullable<typeof ad.location> } =>
        Boolean(
            ad.location &&
            typeof ad.location.latitude === 'number' &&
            !isNaN(ad.location.latitude) &&
            typeof ad.location.longitude === 'number' &&
            !isNaN(ad.location.longitude)
        )
    );

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
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewHandler center={sanitizedCenter} zoom={zoom} bounds={bounds} />

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
                                color: isSelected ? "#2563EB" : "#94A3B8",
                                fillColor: isSelected ? "#3B82F6" : "#CBD5E1",
                                fillOpacity: isSelected ? 0.45 : 0.10,
                                weight: isSelected ? 3.5 : 1.5,
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
                                            fillOpacity: 0.25,
                                            weight: 2.5,
                                            color: "#64748B",
                                        });
                                    }
                                },
                                mouseout: (e) => {
                                    if (!isSelected) {
                                        const layer = e.target;
                                        layer.setStyle({
                                            fillOpacity: 0.10,
                                            weight: 1.5,
                                            color: "#94A3B8",
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
                                        : "font-bold text-xs bg-white/95 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md shadow-md"
                                }
                            >
                                {zone.name}
                            </Tooltip>
                        </Polygon>
                    );
                })}
                {adsWithLocation.map((ad) => {
                    const price = ad.pricing ? Object.values(ad.pricing)[0] : undefined;
                    const priceLabel = price ?
                        (price >= 1000000000 ? `${(price / 1000000000).toFixed(1)} میلیارد` :
                            (price >= 1000000 ? `${(price / 1000000).toFixed(0)} میلیون` : price.toLocaleString()))
                        : "توافقی";

                    return (
                        <Marker
                            key={ad.adId}
                            position={[ad.location.latitude, ad.location.longitude]}
                            icon={createPriceIcon(priceLabel)}
                        >
                            <Popup className="property-popup">
                                <div className="w-64 p-1">
                                    <PropertyCard
                                        adId={ad.adId}
                                        variant="vertical"
                                        title={ad.title}
                                        price={price?.toLocaleString() || "0"}
                                        location={ad.cityId}
                                        image={getMediaPosterUrl(ad.mediaIds?.[0])}
                                        isVideo={ad.mediaIds?.[0]?.type === "VIDEO"}
                                        category={ad.subcategoryTitle || ad.categoryPath.subcategoryTitle || ad.categoryPath.subcategoryKey}
                                    />
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
