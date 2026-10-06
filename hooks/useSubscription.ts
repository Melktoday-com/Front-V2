import { subscriptionService } from "@/services/subscription.service";
import {
    ClaimWelcomePackageRequest,
    CreateSubscriptionPlanRequest,
    PurchasePlanRequest,
    SubscriptionTargetRole,
    UpdateWelcomePackageRequest,
} from "@/types/api/subscription.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useSubscriptionPlans(role?: SubscriptionTargetRole | string) {
    return useQuery({
        queryKey: ["subscription", "plans", role],
        queryFn: () => subscriptionService.listPlans(role),
    });
}

export function useEntitlements() {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["subscription", "entitlements"],
        queryFn: () => subscriptionService.getEntitlements(),
        enabled: isLoggedIn,
    });
}

export function useActiveBadge() {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["subscription", "badge"],
        queryFn: () => subscriptionService.getActiveBadge(),
        enabled: isLoggedIn,
    });
}

export function usePurchasePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PurchasePlanRequest) => subscriptionService.purchasePlan(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}

export function useClaimWelcomePackage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload?: ClaimWelcomePackageRequest) =>
            subscriptionService.claimWelcomePackage(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}

export function useAdminSubscriptionPlans() {
    return useQuery({
        queryKey: ["admin", "subscription", "plans"],
        queryFn: () => subscriptionService.adminListPlans(),
    });
}

export function useAdminCreatePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subscriptionService.adminCreatePlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "subscription", "plans"] });
            queryClient.invalidateQueries({ queryKey: ["subscription", "plans"] });
        },
    });
}

export function useAdminUpdatePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSubscriptionPlanRequest> }) =>
            subscriptionService.adminUpdatePlan(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "subscription", "plans"] });
            queryClient.invalidateQueries({ queryKey: ["subscription", "plans"] });
        },
    });
}

export function useAdminWelcomePackages() {
    return useQuery({
        queryKey: ["admin", "subscription", "welcome-packages"],
        queryFn: () => subscriptionService.adminListWelcomePackages(),
    });
}

export function useAdminUpdateWelcomePackage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateWelcomePackageRequest }) =>
            subscriptionService.adminUpdateWelcomePackage(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "subscription", "welcome-packages"] });
        },
    });
}
