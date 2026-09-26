"use client";

import { GeoCenterPoint } from "@/types/api/geo.types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface City {
    id: string;
    name: string;
    centerPoint?: GeoCenterPoint;
    boundingBox?: {
        minLatitude: number;
        minLongitude: number;
        maxLatitude: number;
        maxLongitude: number;
    } | null;
}

interface CityContextType {
    selectedCity: City;
    setSelectedCity: (city: City) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
    const [selectedCity, setSelectedCityState] = useState<City>({ id: "", name: "" });

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('selectedCity');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                if (parsed.centerPoint) {
                    parsed.centerPoint = {
                        latitude: parsed.centerPoint.latitude,
                        longitude: parsed.centerPoint.longitude,
                    };
                }

                setSelectedCityState(parsed);

                // Silently refresh coordinates against backend geo hierarchy if city name exists
                if (parsed.name) {
                    import('@/services/geo.service').then(({ geoService }) => {
                        geoService.getProvincesHierarchy({ search: parsed.name, limit: 1 })
                            .then((res) => {
                                const freshCity = res.provinces?.flatMap((p) => p.cities).find((c) => c.name === parsed.name);
                                if (freshCity?.centerPoint) {
                                    setSelectedCityState((prev) => {
                                        if (prev.name === freshCity.name && (
                                            prev.centerPoint?.latitude !== freshCity.centerPoint?.latitude ||
                                            prev.centerPoint?.longitude !== freshCity.centerPoint?.longitude
                                        )) {
                                            const updated = {
                                                ...prev,
                                                id: freshCity.id || prev.id,
                                                centerPoint: freshCity.centerPoint,
                                                boundingBox: freshCity.boundingBox ?? prev.boundingBox,
                                            };
                                            localStorage.setItem('selectedCity', JSON.stringify(updated));
                                            return updated;
                                        }
                                        return prev;
                                    });
                                }
                            })
                            .catch(() => {});
                    });
                }
            } catch (e) {
                console.error("Failed to parse saved city", e);
            }
        }
    }, []);

    const setSelectedCity = (city: City) => {
        setSelectedCityState(city);
        if (city.id) {
            localStorage.setItem('selectedCity', JSON.stringify(city));
        } else {
            localStorage.removeItem('selectedCity');
        }
    };

    return (
        <CityContext.Provider value={{ selectedCity, setSelectedCity }}>
            {children}
        </CityContext.Provider>
    );
}

export function useCity() {
    const context = useContext(CityContext);
    if (context === undefined) {
        throw new Error("useCity must be used within a CityProvider");
    }
    return context;
}