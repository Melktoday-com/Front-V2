import { promotionService } from "@/services/promotion.service";
import { RequestPromotionRequest } from "@/types/api/promotion.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePromotionPricing() {
    return useQuery({
        queryKey: ["promotions", "pricing"],
        queryFn: () => promotionService.getPricing(),
    });
}

export function useRequestPromotion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RequestPromotionRequest) =>
            promotionService.requestPromotion(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ad", variables.listingId] });
            queryClient.invalidateQueries({ queryKey: ["ads"] });
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}
