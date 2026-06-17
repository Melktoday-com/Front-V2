"use client";

import { userService } from "@/services/user.service";
import { UpdateUserProfileRequest, VerifyKycRequest } from "@/types/api/user.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUser(userId?: string) {
    const queryClient = useQueryClient();

    const updateProfileMutation = useMutation({
        mutationFn: (data: UpdateUserProfileRequest) => {
            if (!userId) throw new Error("User ID is required");
            return userService.updateProfile(userId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            toast.success("پروفایل با موفقیت بروزرسانی شد");
        },
    });

    const verifyKycMutation = useMutation({
        mutationFn: (data: VerifyKycRequest) => {
            if (!userId) throw new Error("User ID is required");
            return userService.verifyKyc(userId, data);
        },
        onSuccess: (data) => {
            if (data.status === "Verified") {
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
