import { ListTemporaryRentQuery, temporaryRentService } from "@/services/temporary-rent.service";
import { useQuery } from "@tanstack/react-query";

export const useTemporaryRentAds = (query: ListTemporaryRentQuery = {}) => {
    return useQuery({
        queryKey: ["temporary-rent-ads", query],
        queryFn: () => temporaryRentService.list(query),
    });
};

export const useTemporaryRentAdDetail = (id: string) => {
    return useQuery({
        queryKey: ["temporary-rent-ad", id],
        queryFn: () => temporaryRentService.getById(id),
        enabled: !!id,
    });
};
