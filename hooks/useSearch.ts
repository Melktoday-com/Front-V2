import { searchService } from "@/services/search.service";
import { useQuery } from "@tanstack/react-query";

export function useSearchSuggestions(query: string) {
    return useQuery({
        queryKey: ["search-suggestions", query],
        queryFn: () => searchService.getSuggestions(query),
        enabled: query.length >= 2,
        staleTime: 60000, // 1 minute
    });
}

export function useCities() {
    return useQuery({
        queryKey: ["geo-cities"],
        queryFn: () => searchService.getCities(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useNeighborhoods(city?: string) {
    return useQuery({
        queryKey: ["geo-neighborhoods", city],
        queryFn: () => searchService.getNeighborhoods(city!),
        enabled: !!city,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
