import { useGeoHierarchy } from "@/hooks/useGeoHierarchy";
import { useCities } from "@/hooks/useGeo";
import { useMemo } from "react";

export function useCityLookup() {
    const { data: hierarchy, isLoading: isHierarchyLoading } = useGeoHierarchy();
    const { data: citiesData, isLoading: isCitiesLoading } = useCities({ limit: 500 });

    const cityNameMap = useMemo(() => {
        const map: Record<string, string> = {};

        if (hierarchy && Array.isArray(hierarchy)) {
            hierarchy.forEach((province) => {
                province.cities?.forEach((city) => {
                    if (city.id) {
                        map[city.id] = city.name;
                    }
                });
            });
        }

        if (citiesData?.items && Array.isArray(citiesData.items)) {
            citiesData.items.forEach((city) => {
                if (city.id && !map[city.id]) {
                    map[city.id] = city.name;
                }
            });
        }

        return map;
    }, [hierarchy, citiesData]);

    const isLoading = isHierarchyLoading && isCitiesLoading;

    const getCityName = (cityId?: string, fallback = "نامشخص") => {
        if (!cityId) return fallback;
        if (cityNameMap[cityId]) return cityNameMap[cityId];
        if (isLoading) return "در حال بارگذاری...";
        return fallback;
    };

    return {
        cityNameMap,
        getCityName,
        isLoading,
    };
}
