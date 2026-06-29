"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

// Fix for default marker icons
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    initialCenter?: [number, number];
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ initialPosition, onChange }: { initialPosition: [number, number], onChange: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<[number, number]>(initialPosition);

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onChange(lat, lng);
        },
    });

    return position === null ? null : (
        <Marker position={position} draggable={true} eventHandlers={{
            dragend: (e) => {
                const marker = e.target;
                const { lat, lng } = marker.getLatLng();
                setPosition([lat, lng]);
                onChange(lat, lng);
            }
        }} />
    );
}

export default function MapPicker({ initialCenter = [35.6892, 51.3890], onChange }: MapPickerProps) {
    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200">
            <MapContainer
                center={initialCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker initialPosition={initialCenter} onChange={onChange} />
            </MapContainer>
        </div>
    );
}
