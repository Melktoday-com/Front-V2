"use client";

import { AdSummary } from "@/types/api/ads.types";
import { ZoneSummary } from "@/types/api/geo.types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { PropertyCard } from "./PropertyCard";

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

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        } else {
            map.flyTo(center, zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, bounds, map]);

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
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                                color: isSelected ? "#1D4ED8" : "#2563EB",
                                fillColor: isSelected ? "#2563EB" : "#3B82F6",
                                fillOpacity: isSelected ? 0.45 : 0.20,
                                weight: isSelected ? 3.5 : 2,
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (onZoneSelect) {
                                        onZoneSelect(zone);
                                    }
                                },
                            }}
                        >
                            <Tooltip
                                sticky
                                direction="center"
                                className="font-bold text-xs bg-white/95 text-primary border border-primary/20 px-2.5 py-1 rounded-md shadow-md"
                            >
                                {zone.name}
                            </Tooltip>
                        </Polygon>
                    );
                })}
                {adsWithLocation.map((ad) => {
                    const price = Object.values(ad.pricing)[0];
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
                                        title={ad.title}
                                        price={price?.toLocaleString() || "0"}
                                        rating={4.5}
                                        location={ad.cityId}
                                        image={ad.mediaIds && ad.mediaIds.length > 0
                                            ? `${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`
                                            : "/assets/images/property-placeholder.svg"
                                        }
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
