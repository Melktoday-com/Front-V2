"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface City {
    id: string;
    name: string;
    centerPoint?: {
        latitude: number;
        longitude: number;
    };
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

                // Compatibility layer: map old 'lat/lng' to new 'latitude/longitude' if present
                if (parsed.centerPoint && (parsed.centerPoint.lat !== undefined || parsed.centerPoint.lng !== undefined)) {
                    parsed.centerPoint = {
                        latitude: parsed.centerPoint.latitude ?? parsed.centerPoint.lat,
                        longitude: parsed.centerPoint.longitude ?? parsed.centerPoint.lng
                    };
                }

                setSelectedCityState(parsed);
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