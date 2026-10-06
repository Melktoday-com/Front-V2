import api from "@/lib/api/client";
import {
    ActiveBadgeInfo,
    ClaimWelcomePackageRequest,
    ClaimWelcomePackageResponse,
    CreateSubscriptionPlanRequest,
    PurchasePlanRequest,
    PurchasePlanResponse,
    SubscriptionEntitlement,
    SubscriptionPlan,
    SubscriptionTargetRole,
    UpdateSubscriptionPlanRequest,
    UpdateWelcomePackageRequest,
    WelcomePackage,
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

    adminListPlans: async (): Promise<SubscriptionPlan[]> => {
        const { data } = await api.get<SubscriptionPlan[]>("/subscriptions/admin/plans");
        return data;
    },

    adminCreatePlan: async (payload: CreateSubscriptionPlanRequest): Promise<SubscriptionPlan> => {
        const { data } = await api.post<SubscriptionPlan>("/subscriptions/admin/plans", payload);
        return data;
    },

    adminUpdatePlan: async (
        id: string,
        payload: Partial<CreateSubscriptionPlanRequest>,
    ): Promise<SubscriptionPlan> => {
        const { data } = await api.patch<SubscriptionPlan>(`/subscriptions/admin/plans/${id}`, payload);
        return data;
    },

    adminListWelcomePackages: async (): Promise<WelcomePackage[]> => {
        const { data } = await api.get<WelcomePackage[]>("/subscriptions/admin/welcome-packages");
        return data;
    },

    adminUpdateWelcomePackage: async (
        id: string,
        payload: UpdateWelcomePackageRequest,
    ): Promise<WelcomePackage> => {
        const { data } = await api.patch<WelcomePackage>(
            `/subscriptions/admin/welcome-packages/${id}`,
            payload,
        );
        return data;
    },
};
