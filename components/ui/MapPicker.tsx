"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, Crosshair, Info, Loader2, LocateFixed, MapPin, RotateCcw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { toast } from "sonner";
import { cn, toPersianDigits } from "@/lib/utils";

// Leaflet default icon fix for Next.js SSR
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface MapPickerProps {
    /** Initial or default center [lat, lng] */
    initialCenter?: [number, number];
    /** City center coordinates [lat, lng] to center/zoom map */
    cityCenter?: [number, number];
    /** Controlled position [lat, lng] */
    value?: [number, number];
    /** Name of the selected city to display */
    cityName?: string;
    /** Default zoom level (defaults to 13) */
    zoom?: number;
    /** Callback when position changes */
    onChange: (lat: number, lng: number) => void;
    /** Optional container class name */
    className?: string;
    /** Show top action toolbar (default true) */
    showToolbar?: boolean;
}

/**
 * Controller inside MapContainer to manage map view, invalidate size, and handle flyTo
 */
function MapController({
    targetCenter,
    targetZoom,
    onMapReady,
}: {
    targetCenter: [number, number];
    targetZoom: number;
    onMapReady: (map: L.Map) => void;
}) {
    const map = useMap();

    useEffect(() => {
        onMapReady(map);
        // Force size recalculation to avoid partial/grey tiles
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [map, onMapReady]);

    useEffect(() => {
        if (
            Array.isArray(targetCenter) &&
            targetCenter.length === 2 &&
            !isNaN(targetCenter[0]) &&
            !isNaN(targetCenter[1])
        ) {
            map.flyTo(targetCenter, targetZoom, {
                duration: 1.2,
                easeLinearity: 0.25,
            });
        }
    }, [targetCenter[0], targetCenter[1], targetZoom, map]);

    return null;
}

/**
 * Interactive draggable location marker with click listener
 */
function LocationMarker({
    position,
    onChange,
}: {
    position: [number, number];
    onChange: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onChange(lat, lng);
        },
    });

    return (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const { lat, lng } = marker.getLatLng();
                    onChange(lat, lng);
                },
            }}
        />
    );
}

export default function MapPicker({
    initialCenter = [35.6892, 51.3890],
    cityCenter,
    value,
    cityName,
    zoom = 13,
    onChange,
    className,
    showToolbar = true,
}: MapPickerProps) {
    const mapRef = useRef<L.Map | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Determine default coordinates
    const effectiveCityCenter = useMemo<[number, number]>(() => {
        if (
            cityCenter &&
            Array.isArray(cityCenter) &&
            !isNaN(cityCenter[0]) &&
            !isNaN(cityCenter[1])
        ) {
            return cityCenter;
        }
        return initialCenter;
    }, [cityCenter, initialCenter]);

    // Current pin position: use `value` if supplied, otherwise `cityCenter`, otherwise `initialCenter`
    const [position, setPosition] = useState<[number, number]>(
        value || effectiveCityCenter
    );

    // Sync position when parent value changes
    useEffect(() => {
        if (
            value &&
            (value[0] !== position[0] || value[1] !== position[1]) &&
            !isNaN(value[0]) &&
            !isNaN(value[1])
        ) {
            setPosition(value);
        }
    }, [value]);

    // When cityCenter changes from parent (e.g. user selected another city)
    useEffect(() => {
        if (
            cityCenter &&
            Array.isArray(cityCenter) &&
            !isNaN(cityCenter[0]) &&
            !isNaN(cityCenter[1])
        ) {
            setPosition(cityCenter);
            onChange(cityCenter[0], cityCenter[1]);
            if (mapRef.current) {
                mapRef.current.flyTo(cityCenter, zoom, { duration: 1.2 });
            }
        }
    }, [cityCenter?.[0], cityCenter?.[1], zoom]);

    const handlePositionChange = useCallback(
        (lat: number, lng: number) => {
            setPosition([lat, lng]);
            onChange(lat, lng);
        },
        [onChange]
    );

    const handleMapReady = useCallback((map: L.Map) => {
        mapRef.current = map;
    }, []);

    // Get current location via browser Geolocation API
    const handleGetCurrentLocation = () => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            toast.error("مرورگر شما از دریافت موقعیت مکانی پشتیبانی نمی‌کند.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                handlePositionChange(lat, lng);

                if (mapRef.current) {
                    mapRef.current.flyTo([lat, lng], 16, {
                        duration: 1.5,
                    });
                }

                toast.success("موقعیت مکانی فعلی شما با موفقیت شناسایی و روی نقشه تنظیم شد");
                setIsLocating(false);
            },
            (err) => {
                setIsLocating(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        toast.error(
                            "دسترسی به موقعیت مکانی رد شد. لطفاً در تنظیمات مرورگر اجازه دسترسی به موقعیت را فعال نمایید."
                        );
                        break;
                    case err.POSITION_UNAVAILABLE:
                        toast.error(
                            "اطلاعات موقعیت مکانی در دسترس نیست. لطفاً GPS دستگاه خود را روشن کنید."
                        );
                        break;
                    case err.TIMEOUT:
                        toast.error(
                            "زمان درخواست دریافت موقعیت مکانی به پایان رسید. لطفاً مجدداً امتحان کنید."
                        );
                        break;
                    default:
                        toast.error("خطا در دریافت موقعیت مکانی کاربر.");
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            }
        );
    };

    // Reset view to city center
    const handleResetToCityCenter = () => {
        handlePositionChange(effectiveCityCenter[0], effectiveCityCenter[1]);
        if (mapRef.current) {
            mapRef.current.flyTo(effectiveCityCenter, zoom, {
                duration: 1.2,
            });
        }
        toast.info(
            cityName
                ? `نقشه به مرکز ${cityName} بازنشانی شد`
                : "نقشه به مرکز شهر بازنشانی شد"
        );
    };

    return (
        <div className={cn("space-y-3 w-full", className)}>
            {showToolbar && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-gray-50/90 rounded-2xl border border-gray-200 text-xs">
                    {/* City info badge */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] text-text-light font-medium block">شهر انتخابی:</span>
                            <span className="font-black text-brand text-xs truncate block">
                                {cityName || "تعیین‌نشده"}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons: Current Location & City Center */}
                    <div className="flex items-center gap-2 mr-auto">
                        <button
                            type="button"
                            onClick={handleResetToCityCenter}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100/80 text-text-main font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                            title="زوم به مرکز شهر انتخابی"
                        >
                            <Building2 className="w-3.5 h-3.5 text-secondary" />
                            <span>مرکز شهر</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={isLocating}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95",
                                isLocating
                                    ? "bg-primary/70 text-white cursor-wait"
                                    : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                            )}
                            title="یافتن موقعیت فعلی من از طریق GPS"
                        >
                            {isLocating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <LocateFixed className="w-3.5 h-3.5" />
                            )}
                            <span>{isLocating ? "در حال دریافت..." : "موقعیت فعلی من"}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Map Canvas Container */}
            <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0">
                <MapContainer
                    center={position}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController
                        targetCenter={effectiveCityCenter}
                        targetZoom={zoom}
                        onMapReady={handleMapReady}
                    />
                    <LocationMarker
                        position={position}
                        onChange={handlePositionChange}
                    />
                </MapContainer>

                {/* Floating GPS button directly on the map */}
                <div className="absolute bottom-4 right-4 z-[500]">
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        aria-label="موقعیت فعلی من"
                        title="موقعیت فعلی من"
                        className={cn(
                            "w-11 h-11 rounded-2xl bg-white border border-gray-200 text-brand shadow-lg hover:shadow-xl flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50 active:scale-90",
                            isLocating && "text-primary border-primary animate-pulse"
                        )}
                    >
                        {isLocating ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <Crosshair className="w-5 h-5 text-primary" />
                        )}
                    </button>
                </div>

                {/* Bottom coordinates badge */}
                <div className="absolute bottom-4 left-4 z-[500] hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-gray-200 text-[11px] font-bold text-brand shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                        {toPersianDigits(position[0].toFixed(4))} ،{" "}
                        {toPersianDigits(position[1].toFixed(4))}
                    </span>
                </div>
            </div>

            {/* Helper Hint */}
            <div className="flex items-center gap-2 text-[11px] text-text-light px-1">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                    برای تعیین موقعیت دقیق ملک، روی نقطه مورد نظر در نقشه کلیک کنید یا نشانگر قرمز را بکشید. همچنین می‌توانید با دکمه «موقعیت فعلی من» لوکیشن کنونی خود را ثبت کنید.
                </span>
            </div>
        </div>
    );
}
