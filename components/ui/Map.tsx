"use client";

import { AdSummary } from "@/types/api/ads.types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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
    center?: [number, number];
    zoom?: number;
    bounds?: L.LatLngBoundsExpression;
}

export default function Map({ ads, center = [35.6892, 51.3890], zoom = 12, bounds }: MapProps) {
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
    const adsWithLocation = ads.filter(ad =>
        ad.location &&
        typeof ad.location.latitude === 'number' &&
        !isNaN(ad.location.latitude) &&
        typeof ad.location.longitude === 'number' &&
        !isNaN(ad.location.longitude)
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
                                            : "/assets/images/property-placeholder.png"
                                        }
                                        category={ad.categoryPath.subcategoryKey}
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
