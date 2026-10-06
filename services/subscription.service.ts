import api from "@/lib/api/client";
import {
    ActiveBadgeInfo,
    ClaimWelcomePackageRequest,
    ClaimWelcomePackageResponse,
    PurchasePlanRequest,
    PurchasePlanResponse,
    SubscriptionEntitlement,
    SubscriptionPlan,
    SubscriptionTargetRole,
} from "@/types/api/subscription.types";

export const subscriptionService = {
    listPlans: async (role?: SubscriptionTargetRole | string): Promise<SubscriptionPlan[]> => {
        const { data } = await api.get<SubscriptionPlan[]>("/subscriptions/plans", {
            params: role ? { role } : undefined,
        });
        return data;
    },

    purchasePlan: async (payload: PurchasePlanRequest): Promise<PurchasePlanResponse> => {
        const { data } = await api.post<PurchasePlanResponse>("/subscriptions/purchase", payload);
        return data;
    },

    getEntitlements: async (): Promise<SubscriptionEntitlement[]> => {
        const { data } = await api.get<SubscriptionEntitlement[]>("/subscriptions/entitlements");
        return data;
    },

    getActiveBadge: async (): Promise<ActiveBadgeInfo | null> => {
        const { data } = await api.get<ActiveBadgeInfo | null>("/subscriptions/badge");
        return data;
    },

    claimWelcomePackage: async (
        payload?: ClaimWelcomePackageRequest,
    ): Promise<ClaimWelcomePackageResponse> => {
        const { data } = await api.post<ClaimWelcomePackageResponse>(
            "/subscriptions/welcome-package/claim",
            payload || {},
        );
        return data;
    },
};
