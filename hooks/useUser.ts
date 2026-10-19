"use client";

import { normalizeApiError } from "@/lib/api/error-handler";
import { userService } from "@/services/user.service";
import { UpdateUserProfileRequest, VerifyKycRequest } from "@/types/api/user.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export function useUserProfile(userId?: string) {
    return useQuery({
        queryKey: ["user", userId],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return userService.getProfile(userId);
        },
        enabled: !!userId,
    });
}

export function useMeProfile() {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["user", "me"],
        queryFn: () => userService.getMe(),
        enabled: isLoggedIn,
    });
}

export function useUser(userId?: string) {
    const queryClient = useQueryClient();

    const updateProfileMutation = useMutation({
        mutationFn: (data: UpdateUserProfileRequest) => {
            if (userId) {
                return userService.updateProfile(userId, data);
            }
            return userService.updateMe(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["me"] });
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
            queryClient.invalidateQueries({ queryKey: ["agency", "my-application"] });
            queryClient.invalidateQueries({ queryKey: ["hosts", "my-application"] });
            toast.success("پروفایل با موفقیت بروزرسانی شد");
        },
        onError: (err: any) => {
            toast.error(normalizeApiError(err, "خطا در بروزرسانی مشخصات پروفایل"));
        },
    });

    const verifyKycMutation = useMutation({
        mutationFn: (data: VerifyKycRequest) => {
            if (!userId) throw new Error("User ID is required");
            return userService.verifyKyc(userId, data);
        },
        onSuccess: (data) => {
            if (data.status === "verified") {
                toast.success("احراز هویت با موفقیت انجام شد");
            } else {
                toast.error("احراز هویت شکست خورد: " + (data.reason || "خطای ناشناخته"));
            }
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
        },
    });

    return {
        updateProfile: updateProfileMutation.mutate,
        isUpdating: updateProfileMutation.isPending,
        verifyKyc: verifyKycMutation.mutate,
        isVerifying: verifyKycMutation.isPending,
    };
}
