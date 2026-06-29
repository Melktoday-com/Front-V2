"use client";

import { AdSummary } from "@/types/api/ads.types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { PropertyCard } from "./PropertyCard";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    ads: AdSummary[];
    center?: [number, number];
    zoom?: number;
    onAdSelect?: (ad: AdSummary) => void;
}

export default function Map({ ads, center = [35.6892, 51.3890], zoom = 12, onAdSelect }: MapProps) {
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
        typeof ad.location.longitude === 'number'
    );

    return (
        <div className="w-full h-full rounded-[25px] overflow-hidden border border-soft-bg shadow-sm z-0">
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
                {adsWithLocation.map((ad) => (
                    <Marker
                        key={ad.adId}
                        position={[ad.location.latitude, ad.location.longitude]}
                        eventHandlers={{
                            click: () => onAdSelect?.(ad),
                        }}
                    >
                        <Popup className="property-popup">
                            <div className="w-64 p-1">
                                <PropertyCard
                                    adId={ad.adId}
                                    title={ad.title}
                                    price={Object.values(ad.pricing)[0]?.toLocaleString() || "0"}
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
                ))}
            </MapContainer>
        </div>
    );
}
