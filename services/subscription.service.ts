import api from "@/lib/api/client";
import {
    ActiveBadgeInfo,
    ClaimWelcomePackageRequest,
    ClaimWelcomePackageResponse,
    CreateSubscriptionPlanRequest,
    CreateWelcomePackageRequest,
    PurchasePlanRequest,
    PurchasePlanResponse,
    SubscriptionEntitlement,
    SubscriptionPlan,
    SubscriptionTargetRole,
    UpdateSubscriptionPlanRequest,
    UpdateWelcomePackageRequest,
    UserSubscriptionStatusResponse,
    WelcomePackage,
    WelcomePackageEligibilityResponse,
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

    getMySubscriptionStatus: async (): Promise<UserSubscriptionStatusResponse> => {
        const { data } = await api.get<UserSubscriptionStatusResponse>("/subscriptions/my-status");
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

    getWelcomeEligibility: async (
        role?: SubscriptionTargetRole | string,
    ): Promise<WelcomePackageEligibilityResponse> => {
        const { data } = await api.get<WelcomePackageEligibilityResponse>(
            "/subscriptions/welcome-package/eligibility",
            {
                params: role ? { role } : undefined,
            },
        );
        return data;
    },

    autoGrantWelcomePackage: async (
        payload?: ClaimWelcomePackageRequest,
    ): Promise<ClaimWelcomePackageResponse> => {
        try {
            const { data } = await api.post<ClaimWelcomePackageResponse>(
                "/subscriptions/welcome-package/auto-grant",
                payload || {},
            );
            return data;
        } catch (error: any) {
            if (
                error?.response?.status === 404 ||
                error?.response?.data?.error?.code === "RESOURCE_NOT_FOUND"
            ) {
                return {
                    claimed: false,
                    packageTitle: "",
                    targetRole: payload?.targetRole || "",
                    message:
                        error?.response?.data?.error?.message ||
                        "بسته خوشآمدگویی فعالی یافت نشد.",
                };
            }
            throw error;
        }
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

    adminCreateWelcomePackage: async (
        payload: CreateWelcomePackageRequest,
    ): Promise<WelcomePackage> => {
        const { data } = await api.post<WelcomePackage>(
            "/subscriptions/admin/welcome-packages",
            payload,
        );
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
