"use client";

import { useAuth } from "./useAuth";
import { useMeProfile } from "./useUser";

/**
 * useUserStatus
 *
 * Centralized hook to determine user account moderation status (Active, Suspended, Blocked/Banned)
 * and enforce permissions across the frontend application.
 *
 * Rules:
 *  - Suspended / Banned users CANNOT submit standard ads, temporary rent listings,
 *    reviews/comments, or role applications.
 *  - Suspended / Banned users CAN always view their profile and update their personal profile info.
 */
export function useUserStatus() {
    const { isLoggedIn, user } = useAuth();
    const { data: profile, isLoading, refetch } = useMeProfile();

    const rawStatus = (profile?.status || (isLoggedIn ? "Active" : "")).toLowerCase();
    const isSuspended = rawStatus === "suspended";
    const isBanned = rawStatus === "blocked" || rawStatus === "banned";
    const isActive = rawStatus === "active";
    const isRestricted = isSuspended || isBanned;

    const statusLabel = isBanned
        ? "مسدود شده"
        : isSuspended
        ? "تعلیق موقت"
        : isActive
        ? "فعال"
        : "نامشخص";

    const restrictionTitle = isBanned
        ? "حساب کاربری شما مسدود است"
        : isSuspended
        ? "حساب کاربری شما تعلیق شده است"
        : null;

    const restrictionMessage = isBanned
        ? "دسترسی شما به دلیل نقض قوانین مسدود شده است و امکان ثبت آگهی، ثبت اقامتگاه یا درج دیدگاه را ندارید. امکان مشاهده و ویرایش اطلاعات پروفایل فعال است."
        : isSuspended
        ? "حساب کاربری شما در وضعیت تعلیق موقت قرار دارد و تا زمان رفع تعلیق امکان ثبت آگهی، ثبت اقامتگاه یا ارسال نظر را ندارید. امکان مشاهده و ویرایش پروفایل برای شما فعال است."
        : null;

    const canCreateAd = isActive && !isRestricted;
    const canCreateTemporaryRent = isActive && !isRestricted;
    const canSubmitReview = isActive && !isRestricted;
    const canApplyRole = isActive && !isRestricted;
    const canEditProfile = true; // Always permitted

    return {
        profile: profile ?? null,
        status: profile?.status,
        statusLabel,
        isActive,
        isSuspended,
        isBanned,
        isRestricted,
        restrictionTitle,
        restrictionMessage,
        canCreateAd,
        canCreateTemporaryRent,
        canSubmitReview,
        canApplyRole,
        canEditProfile,
        isLoading,
        refetch,
    };
}
