import api from "@/lib/api/client";
import {
    PromotionPricingResponse,
    RequestPromotionRequest,
    RequestPromotionResponse,
} from "@/types/api/promotion.types";

export const promotionService = {
    getPricing: async (): Promise<PromotionPricingResponse> => {
        const { data } = await api.get<PromotionPricingResponse>("/promotions/pricing");
        return data;
    },

    requestPromotion: async (
        payload: RequestPromotionRequest
    ): Promise<RequestPromotionResponse> => {
        const { data } = await api.post<RequestPromotionResponse>(
            "/promotions",
            payload
        );
        return data;
    },
};
