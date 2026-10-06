import { subscriptionService } from "@/services/subscription.service";
import {
    ClaimWelcomePackageRequest,
    PurchasePlanRequest,
    SubscriptionTargetRole,
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
