"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { AccountStatusBanner } from "@/components/ui/AccountStatusBanner";
import { Button } from "@/components/ui/Button";
import { useMyAgency } from "@/hooks/useAgencies";
import { useAuth, useLogout, useSwitchRole } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useHostProfile } from "@/hooks/useShowcase";
import { useMeProfile, useUser } from "@/hooks/useUser";
import { useUserStatus } from "@/hooks/useUserStatus";
import { useWallet } from "@/hooks/useWallet";
import { cn, formatCurrency, getMediaUrl, rialToToman, toEnglishDigits, toOnlyDigits, toPersianDigits } from "@/lib/utils";
import { mediaService } from "@/services/media.service";
import { userService } from "@/services/user.service";
import MediaIconUpload from "@/components/admin/MediaIconUpload";
import { normalizeApiError } from "@/lib/api/error-handler";
import { RoleName, isRoleAdmin, tryRoleNameFrom } from "@/types/access";
import { CitizenType, ForeignIdType, KYCStatus } from "@/types/api/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    ArrowRight,
    Bell,
    Building2,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronLeft,
    CreditCard,
    ExternalLink,
    FileText,
    Hotel,
    LayoutList,
    Loader2,
    Lock,
    LogOut,
    MessageSquare,
    Phone,
    ShieldCheck,
    Sparkles,
    User,
    X,
    Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// 12 Jalali Months
export const JALALI_MONTHS = [
    { id: 1, name: "فروردین", days: 31 },
    { id: 2, name: "اردیبهشت", days: 31 },
    { id: 3, name: "خرداد", days: 31 },
    { id: 4, name: "تیر", days: 31 },
    { id: 5, name: "مرداد", days: 31 },
    { id: 6, name: "شهریور", days: 31 },
    { id: 7, name: "مهر", days: 30 },
    { id: 8, name: "آبان", days: 30 },
    { id: 9, name: "آذر", days: 30 },
    { id: 10, name: "دی", days: 30 },
    { id: 11, name: "بهمن", days: 30 },
    { id: 12, name: "اسفند", days: 29 },
];

// Current Jalali Year calculator
export const getCurrentJalaliYear = (): number => {
    try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric" }).formatToParts(new Date());
        const y = parts.find((p) => p.type === "year")?.value;
        if (y) return parseInt(y, 10);
    } catch { }
    return 1404;
};

// Age calculator based on Jalali calendar
export const calculateJalaliAge = (year: number | null, month: number | null, day: number | null): number | null => {
    if (!year || !month || !day) return null;
    let nowYear = 1404;
    let nowMonth = 8;
    let nowDay = 10;

    try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        }).formatToParts(new Date());
        const y = parts.find((p) => p.type === "year")?.value;
        const m = parts.find((p) => p.type === "month")?.value;
        const d = parts.find((p) => p.type === "day")?.value;
        if (y) nowYear = parseInt(y, 10);
        if (m) nowMonth = parseInt(m, 10);
        if (d) nowDay = parseInt(d, 10);
    } catch { }

    let age = nowYear - year;
    if (nowMonth < month || (nowMonth === month && nowDay < day)) {
        age--;
    }
    return age;
};

export default function ProfileScene() {
    const { user, activeRole, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const { logout } = useLogout();
    const switchRoleMutation = useSwitchRole();
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [citizenType, setCitizenType] = useState<CitizenType>(CitizenType.IRANIAN);
    const [foreignIdType, setForeignIdType] = useState<ForeignIdType>(ForeignIdType.FIDA);
    const [foreignId, setForeignId] = useState("");
    const [documentUrl, setDocumentUrl] = useState("");
    const [nationalCode, setNationalCode] = useState("");
    const [birthDate, setBirthDate] = useState("");

    // Persian Date Picker States (from khodesadi-team design)
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [isDatePickerView, setIsDatePickerView] = useState(false);
    const [datePickerSubStep, setDatePickerSubStep] = useState<"year" | "month" | "day">("year");

    const currentJalaliYear = useMemo(() => getCurrentJalaliYear(), []);

    // Year range: from current Jalali year down to 1320
    const yearsList = useMemo(() => {
        const list: number[] = [];
        for (let y = currentJalaliYear; y >= 1320; y--) {
            list.push(y);
        }
        return list;
    }, [currentJalaliYear]);

    // Calculate max days for the currently selected month
    const currentMonthMaxDays = useMemo(() => {
        if (!selectedMonth) return 31;
        if (selectedMonth <= 6) return 31;
        if (selectedMonth <= 11) return 30;
        return 29;
    }, [selectedMonth]);

    // Calculate user age based on selected Jalali date
    const userAge = useMemo(() => {
        return calculateJalaliAge(selectedYear, selectedMonth, selectedDay);
    }, [selectedYear, selectedMonth, selectedDay]);

    // Synchronize parsed date if birthDate string changes
    useEffect(() => {
        if (!birthDate) return;
        const clean = toEnglishDigits(birthDate).replace(/\D/g, "");
        if (clean.length === 8) {
            const y = parseInt(clean.substring(0, 4), 10);
            const m = parseInt(clean.substring(4, 6), 10);
            const d = parseInt(clean.substring(6, 8), 10);
            if (y >= 1320 && y <= currentJalaliYear) setSelectedYear(y);
            if (m >= 1 && m <= 12) setSelectedMonth(m);
            if (d >= 1 && d <= 31) setSelectedDay(d);
        }
    }, [birthDate, currentJalaliYear]);

    const handleOpenDatePicker = () => {
        if (!selectedYear) {
            setDatePickerSubStep("year");
        } else if (!selectedMonth) {
            setDatePickerSubStep("month");
        } else {
            setDatePickerSubStep("day");
        }
        setIsDatePickerView(true);
    };

    const handleSelectYear = (y: number) => {
        setSelectedYear(y);
        if (selectedMonth && selectedDay) {
            const maxDays = selectedMonth <= 6 ? 31 : selectedMonth <= 11 ? 30 : 29;
            const safeDay = Math.min(selectedDay, maxDays);
            setBirthDate(`${y}/${String(selectedMonth).padStart(2, "0")}/${String(safeDay).padStart(2, "0")}`);
        }
        setDatePickerSubStep("month");
    };

    const handleSelectMonth = (m: number) => {
        setSelectedMonth(m);
        const maxDays = m <= 6 ? 31 : m <= 11 ? 30 : 29;
        let dayToUse = selectedDay;
        if (dayToUse && dayToUse > maxDays) {
            dayToUse = maxDays;
            setSelectedDay(dayToUse);
        }
        if (selectedYear && dayToUse) {
            setBirthDate(`${selectedYear}/${String(m).padStart(2, "0")}/${String(dayToUse).padStart(2, "0")}`);
        }
        setDatePickerSubStep("day");
    };

    const handleSelectDay = (d: number) => {
        setSelectedDay(d);
        if (selectedYear && selectedMonth) {
            setBirthDate(`${selectedYear}/${String(selectedMonth).padStart(2, "0")}/${String(d).padStart(2, "0")}`);
            setIsDatePickerView(false);
        }
    };

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: profile } = useMeProfile();
    const { data: myAgency } = useMyAgency();
    const { data: hostProfile } = useHostProfile();
    const { updateProfile, isUpdating } = useUser(user?.userId);

    const displayName = useMemo(() => {
        if (activeRole === RoleName.Agent && (myAgency?.agencyName || myAgency?.name)) {
            return myAgency.agencyName || myAgency.name;
        }
        if (activeRole === RoleName.Landlord && (hostProfile?.hostName || hostProfile?.title)) {
            return hostProfile.hostName || hostProfile.title;
        }
        return [firstName, lastName].filter(Boolean).join(" ") || "کاربر ملک تودی";
    }, [activeRole, myAgency?.agencyName, myAgency?.name, hostProfile?.hostName, hostProfile?.title, firstName, lastName]);

    const displaySubtitle = useMemo(() => {
        if ((activeRole === RoleName.Agent && (myAgency?.agencyName || myAgency?.name)) ||
            (activeRole === RoleName.Landlord && (hostProfile?.hostName || hostProfile?.title))) {
            const personalName = [firstName, lastName].filter(Boolean).join(" ");
            return personalName ? `مدیر حساب: ${personalName}` : null;
        }
        return null;
    }, [activeRole, myAgency?.agencyName, myAgency?.name, hostProfile?.hostName, hostProfile?.title, firstName, lastName]);

    const kycMutation = useMutation({
        mutationFn: () => {
            const formattedBirthDate =
                selectedYear && selectedMonth && selectedDay
                    ? `${selectedYear}${String(selectedMonth).padStart(2, "0")}${String(selectedDay).padStart(2, "0")}`
                    : (birthDate ? toEnglishDigits(birthDate).replace(/\D/g, "") : undefined);

            return userService.verifyKyc(user!.userId, {
                citizenType,
                nationalCode: citizenType === CitizenType.IRANIAN ? nationalCode : undefined,
                foreignIdType: citizenType === CitizenType.FOREIGNER ? foreignIdType : undefined,
                foreignId: citizenType === CitizenType.FOREIGNER ? foreignId : undefined,
                documentUrl: citizenType === CitizenType.FOREIGNER ? documentUrl : undefined,
                birthDate: formattedBirthDate,
                firstName,
                lastName,
            });
        },
        onSuccess: (res) => {
            if (res.status === KYCStatus.VERIFIED) {
                toast.success("احراز هویت شما با موفقیت تایید شد.");
                setIsKycModalOpen(false);
                setIsDatePickerView(false);
                queryClient.invalidateQueries({ queryKey: ["user"] });
                queryClient.invalidateQueries({ queryKey: ["me"] });
            } else if (res.status === KYCStatus.IN_PROGRESS) {
                toast.success(res.reason || "مدارک هویتی اتباع با موفقیت ثبت شد و در صف بررسی کارشناس قرار گرفت.");
                setIsKycModalOpen(false);
                setIsDatePickerView(false);
                queryClient.invalidateQueries({ queryKey: ["user"] });
                queryClient.invalidateQueries({ queryKey: ["me"] });
            } else {
                toast.error(res.reason || "اطلاعات با سامانه ثبت احوال همخوانی ندارد.");
            }
        },
        onError: (err: any) => {
            const msg = normalizeApiError(err, "خطا در استعلام یا ثبت مدارک احراز هویت");
            toast.error(msg);
        },
    });

    const { isRestricted, isBanned, isSuspended, statusLabel } = useUserStatus();

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("لطفاً یک فایل تصویری معتبر انتخاب کنید");
            return;
        }

        try {
            setIsUploadingAvatar(true);
            const media = await mediaService.upload(file, "PUBLIC", "IMAGE");
            const mediaUrl = media.url || getMediaUrl(media.id || media.mediaId);
            await userService.updateMe({ avatarUrl: mediaUrl });
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["me"] });
            toast.success("تصویر نمایه با موفقیت بروزرسانی شد");
        } catch {
            toast.error("خطا در بارگذاری تصویر نمایه");
        } finally {
            setIsUploadingAvatar(false);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = "";
            }
        }
    };

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || "");
            setLastName(profile.lastName || "");
        }
    }, [profile]);

    const { balance, isLoadingBalance } = useWallet();
    const { data: conversations } = useConversations();
    const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();
    const unreadChatCount = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

    const roleLabels: Record<string, string> = {
        user: "کاربر معمولی",
        admin: "ادمین",
        "super-admin": "مدیر کل",
        agent: "مشاور املاک",
        landlord: "میزبان",
    };

    const userRoles = (profile?.roles || [])
        .map((r) => tryRoleNameFrom(r))
        .filter((r): r is RoleName => r !== null);

    const handleSwitchRole = async (targetRole: RoleName) => {
        if (!user?.sessionId || activeRole === targetRole || switchRoleMutation.isPending) return;
        try {
            await switchRoleMutation.mutateAsync({
                sessionId: user.sessionId,
                roleName: targetRole,
            });
            toast.success(`نقش فعال شما به «${roleLabels[targetRole] || targetRole}» تغییر یافت.`);
        } catch {
            toast.error("خطا در تغییر نقش فعال.");
        }
    };

    if (!isAuthLoading && !isLoggedIn) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-soft-bg mx-auto flex items-center justify-center text-secondary">
                    <User className="w-10 h-10 opacity-40" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-brand">ورود به حساب کاربری</h2>
                    <p className="text-sm text-secondary font-medium">
                        برای مشاهده پروفایل و مدیریت حساب خود، ابتدا وارد شوید.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/auth?redirect=/profile")}
                    className="w-full h-12 rounded-2xl font-bold"
                >
                    ورود به حساب
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-6 max-w-2xl mx-auto">
                {/* Account Status Alert if Suspended or Banned */}
                <AccountStatusBanner showNotificationLink={true} />

                {/* Profile Info */}
                <section className="bg-soft-bg rounded-[30px] p-6 space-y-6 border border-soft-border">
                    <div className="flex items-center gap-4">
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <div className="relative group shrink-0">
                            <div className="w-18 h-18 rounded-full bg-surface border-2 border-soft-border flex items-center justify-center overflow-hidden shadow-xs">
                                {profile?.avatarUrl ? (
                                    <Image
                                        src={getMediaUrl(profile.avatarUrl)}
                                        alt={firstName || "Profile"}
                                        className="w-full h-full object-cover"
                                        width={18}
                                        height={18}
                                    />
                                ) : (
                                    <User className="w-9 h-9 text-brand/60" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className="absolute -bottom-1 -left-1 w-7 h-7 bg-brand text-white rounded-full flex items-center justify-center shadow-md hover:bg-brand/90 hover:scale-110 active:scale-95 transition-all border-2 border-white cursor-pointer"
                                title="تغییر تصویر نمایه"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Camera className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-brand font-black text-lg truncate">
                                {displayName}
                            </div>
                            {displaySubtitle && (
                                <div className="text-xs text-foreground-muted font-medium truncate mt-0.5">
                                    {displaySubtitle}
                                </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase",
                                    activeRole === 'user' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                                )}>
                                    {roleLabels[activeRole || 'user']}
                                </span>

                                {isRestricted && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[10px] font-black",
                                        isBanned ? "bg-error-subtle text-error" : "bg-warning-subtle text-warning"
                                    )}>
                                        وضعیت: {statusLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {userRoles.length > 1 && (
                        <div className="pt-4 border-t border-soft-border/80">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-brand">تغییر نقش فعال در حساب:</span>
                                {switchRoleMutation.isPending && (
                                    <span className="text-[11px] text-secondary flex items-center gap-1 font-medium">
                                        <Loader2 className="w-3 h-3 animate-spin text-primary" /> در حال تغییر نقش...
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {userRoles.map((role) => {
                                    const isActive = activeRole === role;
                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            disabled={isActive || switchRoleMutation.isPending}
                                            onClick={() => handleSwitchRole(role)}
                                            className={cn(
                                                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                                                isActive
                                                    ? "bg-brand text-white shadow-sm ring-2 ring-brand/20 cursor-default"
                                                    : "bg-surface text-secondary hover:text-brand border border-soft-border hover:border-brand/40 active:scale-95"
                                            )}
                                        >
                                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                            <span>{roleLabels[role] || role}</span>
                                            {isActive && <span className="text-[10px] text-white/70 font-normal">(فعال)</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between pr-2">
                                <label className="text-brand text-sm font-bold flex items-center gap-1.5">
                                    <Phone className="w-4 h-4 text-secondary" />
                                    شماره موبایل
                                </label>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success-subtle px-2.5 py-1 rounded-lg border border-success/30">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    تایید شده با پیامک
                                </span>
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-secondary/60" />
                                <input
                                    type="text"
                                    value={toPersianDigits(profile?.mobileNumber || "")}
                                    readOnly
                                    disabled
                                    dir="ltr"
                                    className="w-full bg-surface-secondary/80 border border-soft-border rounded-2xl py-3 px-4 text-sm font-black text-brand cursor-not-allowed outline-none select-all"
                                />

                            </div>
                            <p className="text-[11px] text-secondary font-medium pr-1">
                                شماره همراه شناسه هویتی یکتای حساب شماست. در حال حاضر امکان ویرایش شماره تلفن در پلتفرم وجود ندارد.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-brand text-sm font-bold pr-2">نام</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-surface border border-soft-border rounded-2xl py-3 px-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="وارد کنید..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-brand text-sm font-bold pr-2">
                                نام خانوادگی
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-surface border border-soft-border rounded-2xl py-3 px-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="وارد کنید..."
                            />
                        </div>
                        <Button
                            className="w-full h-12 rounded-2xl"
                            disabled={isUpdating}
                            onClick={() => {
                                if (!firstName.trim() && !lastName.trim()) {
                                    toast.error("لطفاً نام یا نام خانوادگی را وارد نمایید");
                                    return;
                                }
                                updateProfile({
                                    firstName: firstName.trim(),
                                    lastName: lastName.trim(),
                                });
                            }}
                        >
                            {isUpdating ? "در حال ثبت..." : "بروزرسانی مشخصات"}
                        </Button>
                    </div>
                </section>

                {/* Dashboard Options based on Permissions */}
                <section className="grid gap-4">
                    <RoleGuard roles={[RoleName.Agent]} requireActiveRole>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-brand/10 hover:bg-brand/5"
                                onClick={async () => {
                                    if (activeRole !== RoleName.Agent && user?.sessionId) {
                                        try {
                                            await switchRoleMutation.mutateAsync({
                                                sessionId: user.sessionId,
                                                roleName: RoleName.Agent,
                                            });
                                        } catch {
                                            // continue navigation
                                        }
                                    }
                                    router.push('/agency/panel');
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-brand/5 text-brand">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-brand">مدیریت آژانس من</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-secondary" />
                            </Button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href="/posts/create"
                                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-xs font-black text-purple-800 transition-colors border border-purple-200/80 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        <span>استودیو انتشار پست و مقاله</span>
                                    </div>
                                    <span className="text-[11px] text-purple-500 font-bold">&larr;</span>
                                </Link>
                                {myAgency && (
                                    <Link
                                        href={`/agency/showcase/${myAgency.slug || myAgency.id}`}
                                        target="_blank"
                                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-secondary hover:bg-surface-secondary text-xs font-bold text-foreground-secondary transition-colors border border-border-subtle/80 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4 text-info" />
                                            <span>ویترین عمومی آژانس</span>
                                        </div>
                                        <span className="text-[11px] text-foreground-muted font-medium group-hover:text-info transition-colors">&larr;</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </RoleGuard>

                    <RoleGuard roles={[RoleName.Landlord]} requireActiveRole>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                                onClick={async () => {
                                    if (activeRole !== RoleName.Landlord && user?.sessionId) {
                                        try {
                                            await switchRoleMutation.mutateAsync({
                                                sessionId: user.sessionId,
                                                roleName: RoleName.Landlord,
                                            });
                                        } catch {
                                            // continue navigation
                                        }
                                    }
                                    router.push('/profile/temporary-rent');
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                        <Hotel className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-brand">پنل اقامتگاه‌ها (میزبان)</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-secondary" />
                            </Button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href="/posts/create"
                                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-success-subtle hover:bg-success-subtle text-xs font-black text-success transition-colors border border-success/30/80 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-success" />
                                        <span>استودیو انتشار پست اقامتگاه</span>
                                    </div>
                                    <span className="text-[11px] text-success font-bold">&larr;</span>
                                </Link>
                                {hostProfile && (
                                    <Link
                                        href={`/host/${hostProfile.slug || hostProfile.id || hostProfile.userId}`}
                                        target="_blank"
                                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-secondary hover:bg-surface-secondary text-xs font-bold text-foreground-secondary transition-colors border border-border-subtle/80 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4 text-success" />
                                            <span>صفحه عمومی میزبان</span>
                                        </div>
                                        <span className="text-[11px] text-foreground-muted font-medium group-hover:text-success transition-colors">&larr;</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </RoleGuard>

                    {isRoleAdmin(activeRole) && (
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-primary/20 hover:bg-primary/5"
                                onClick={() => router.push('/admin')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-brand">پنل مدیریت</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-secondary" />
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                        onClick={() => router.push('/wallet')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-brand">کیف پول و تراکنش‌ها</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary text-xs">{formatCurrency(rialToToman(balance?.balance))} تومان</span>
                            <ChevronLeft className="w-5 h-5 text-secondary" />
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                        onClick={() => router.push('/subscriptions')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-brand block text-sm">پلن‌های اشتراک و سهمیه‌ها</span>
                                <span className="text-[11px] text-secondary">سهمیه باقیمانده، نشان تایید، ارتقای پلن</span>
                            </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-secondary" />
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-16 rounded-[25px] flex items-center justify-between px-6 border-soft-border hover:bg-soft-bg"
                        onClick={() => router.push('/profile/ads')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-soft-bg text-secondary">
                                <LayoutList className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-brand">آگهی‌های من</span>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-secondary" />
                    </Button>
                </section>

                {/* Account Actions */}
                <section className="space-y-3">


                    <button
                        onClick={() => router.push("/profile/requests")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                درخواست‌های من (عضویت و میزبانی)
                            </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-secondary" />
                    </button>


                    <button
                        onClick={() => router.push("/profile/chat")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                پیام‌های من
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadChatCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary">
                                    {toPersianDigits(unreadChatCount)}
                                </span>
                            )}
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </div>
                    </button>

                    <button
                        onClick={() => router.push("/notifications")}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                اعلان‌های من
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadNotificationsCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
                                    {toPersianDigits(unreadNotificationsCount)}
                                </span>
                            )}
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (profile?.kycStatus === KYCStatus.VERIFIED) {
                                toast.info("هویت شما قبلاً با موفقیت تایید شده است.");
                            } else {
                                setIsKycModalOpen(true);
                            }
                        }}
                        className="w-full flex items-center justify-between p-5 bg-soft-bg rounded-2xl border border-soft-border hover:bg-soft-border/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-brand font-bold text-sm">
                                احراز هویت (KYC)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] px-2 py-1 rounded-full font-bold",
                                profile?.kycStatus === KYCStatus.VERIFIED ? "bg-success-subtle text-success" :
                                    profile?.kycStatus === KYCStatus.PENDING || profile?.kycStatus === KYCStatus.IN_PROGRESS ? "bg-orange-50 text-orange-600" :
                                        "bg-error-subtle text-error"
                            )}>
                                {profile?.kycStatus === KYCStatus.VERIFIED ? "تایید شده" :
                                    profile?.kycStatus === KYCStatus.PENDING || profile?.kycStatus === KYCStatus.IN_PROGRESS ? "در انتظار تایید" : "تایید نشده"}
                            </span>
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </div>
                    </button>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-between p-5 bg-error-subtle rounded-2xl border border-error/30 hover:bg-error-subtle transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-error" />
                            <span className="text-error font-bold text-sm">
                                خروج از حساب
                            </span>
                        </div>
                    </button>
                </section>
            </div>

            {/* KYC Verification Modal */}
            {isKycModalOpen && (
                <div role="dialog" aria-modal="true" aria-label="احراز هویت هوشمند" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
                    <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-border-subtle my-8">
                        {isDatePickerView ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95">
                                {/* Header & Back Action */}
                                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setIsDatePickerView(false)}
                                            className="w-8 h-8 rounded-xl bg-surface-secondary hover:bg-gray-200 border border-border-subtle flex items-center justify-center text-secondary hover:text-brand transition-all cursor-pointer"
                                            title="بازگشت به فرم"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <div>
                                            <h4 className="text-sm font-black text-brand">
                                                انتخاب تاریخ تولد
                                            </h4>
                                            <p className="text-[11px] text-text-light">
                                                سال، ماه و روز تولد خود را مشخص فرمایید
                                            </p>
                                        </div>
                                    </div>

                                    {selectedYear && selectedMonth && selectedDay && (
                                        <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
                                            {toPersianDigits(`${selectedYear}/${String(selectedMonth).padStart(2, "0")}/${String(selectedDay).padStart(2, "0")}`)}
                                        </div>
                                    )}
                                </div>

                                {/* Step Selector Tabs (Year / Month / Day) */}
                                <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface-secondary border border-border-subtle">
                                    <button
                                        type="button"
                                        onClick={() => setDatePickerSubStep("year")}
                                        className={cn(
                                            "py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer",
                                            datePickerSubStep === "year"
                                                ? "bg-primary text-white shadow-xs font-black"
                                                : "text-secondary hover:text-brand"
                                        )}
                                    >
                                        سال {selectedYear ? `(${toPersianDigits(selectedYear)})` : ""}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatePickerSubStep("month")}
                                        className={cn(
                                            "py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer",
                                            datePickerSubStep === "month"
                                                ? "bg-primary text-white shadow-xs font-black"
                                                : "text-secondary hover:text-brand"
                                        )}
                                    >
                                        ماه {selectedMonth ? `(${JALALI_MONTHS[selectedMonth - 1]?.name})` : ""}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatePickerSubStep("day")}
                                        className={cn(
                                            "py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer",
                                            datePickerSubStep === "day"
                                                ? "bg-primary text-white shadow-xs font-black"
                                                : "text-secondary hover:text-brand"
                                        )}
                                    >
                                        روز {selectedDay ? `(${toPersianDigits(selectedDay)})` : ""}
                                    </button>
                                </div>

                                {/* 1. Year Grid */}
                                {datePickerSubStep === "year" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-secondary font-bold">
                                            <span>سال تولد خود را انتخاب نمایید:</span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 sm:max-h-72 overflow-y-auto p-1.5 border border-border-subtle rounded-2xl bg-surface-secondary/50">
                                            {yearsList.map((y) => (
                                                <button
                                                    key={y}
                                                    type="button"
                                                    onClick={() => handleSelectYear(y)}
                                                    className={cn(
                                                        "py-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer active:scale-95",
                                                        selectedYear === y
                                                            ? "bg-primary text-white shadow-sm font-black"
                                                            : "bg-surface hover:bg-primary/10 hover:text-primary border border-border-subtle text-brand"
                                                    )}
                                                >
                                                    {toPersianDigits(y)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Month Grid */}
                                {datePickerSubStep === "month" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-secondary font-bold">
                                            <span>ماه تولد را انتخاب کنید:</span>
                                            {selectedYear && (
                                                <span className="text-primary text-xs">
                                                    سال انتخاب‌شده: {toPersianDigits(selectedYear)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2.5 max-h-60 sm:max-h-72 overflow-y-auto p-1.5">
                                            {JALALI_MONTHS.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => handleSelectMonth(m.id)}
                                                    className={cn(
                                                        "py-3 px-2 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer active:scale-95 border",
                                                        selectedMonth === m.id
                                                            ? "bg-primary text-white border-primary shadow-sm font-black"
                                                            : "bg-surface-secondary border-border-subtle hover:border-primary text-brand"
                                                    )}
                                                >
                                                    <span className="text-sm block">{m.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Day Grid */}
                                {datePickerSubStep === "day" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-secondary font-bold">
                                            <span>
                                                روز تولد را انتخاب کنید ({selectedMonth ? JALALI_MONTHS[selectedMonth - 1]?.name : ""}):
                                            </span>
                                            {selectedYear && selectedMonth && (
                                                <span className="text-primary text-xs">
                                                    {toPersianDigits(selectedYear)} / {JALALI_MONTHS[selectedMonth - 1]?.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-7 gap-2 max-h-60 sm:max-h-72 overflow-y-auto p-2 border border-border-subtle rounded-2xl bg-surface-secondary/50">
                                            {Array.from({ length: currentMonthMaxDays }, (_, i) => i + 1).map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => handleSelectDay(d)}
                                                    className={cn(
                                                        "w-10 h-10 mx-auto rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95",
                                                        selectedDay === d
                                                            ? "bg-primary text-white shadow-sm font-black"
                                                            : "bg-surface hover:bg-primary/10 hover:text-primary border border-border-subtle text-brand"
                                                    )}
                                                >
                                                    {toPersianDigits(d)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                                    {selectedYear && selectedMonth && selectedDay ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsDatePickerView(false)}
                                            className="h-11 px-5 w-full rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-md shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span>تایید و بازگشت به فرم</span>
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsDatePickerView(false)}
                                            className="h-11 px-5 w-full rounded-xl border border-border-subtle text-secondary hover:bg-surface-secondary text-xs font-bold transition-all"
                                        >
                                            بازگشت به فرم
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                                    <h3 className="font-black text-brand text-base flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                        <span>احراز هویت کاربران (ایرانی و اتباع)</span>
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setIsKycModalOpen(false);
                                            setIsDatePickerView(false);
                                        }}
                                        className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-text-light hover:bg-gray-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Citizenship Tabs */}
                                <div className="flex bg-surface-secondary p-1 rounded-2xl border border-border-subtle text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setCitizenType(CitizenType.IRANIAN)}
                                        className={cn(
                                            "flex-1 py-2 rounded-xl transition-all",
                                            citizenType === CitizenType.IRANIAN
                                                ? "bg-surface text-brand shadow-xs"
                                                : "text-secondary hover:text-brand"
                                        )}
                                    >
                                        شهروند ایرانی (شاهکار)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCitizenType(CitizenType.FOREIGNER)}
                                        className={cn(
                                            "flex-1 py-2 rounded-xl transition-all",
                                            citizenType === CitizenType.FOREIGNER
                                                ? "bg-surface text-brand shadow-xs"
                                                : "text-secondary hover:text-brand"
                                        )}
                                    >
                                        اتباع خارجی (فراگیر / گذرنامه)
                                    </button>
                                </div>

                                {citizenType === CitizenType.IRANIAN ? (
                                    <>
                                        <p className="text-xs text-text-light leading-relaxed">
                                            جهت تایید آنی هویت و تطبیق با مالکیت شماره همراه، کد ملی ۱۰ رقمی و تاریخ تولد خود را وارد فرمایید.
                                        </p>

                                        <div className="space-y-3.5 text-xs">
                                            <div>
                                                <label className="block font-bold text-brand mb-1.5 flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                                                    <span>کد ملی ۱۰ رقمی</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={10}
                                                    placeholder="مثلاً: ۰۰۱۲۳۴۵۶۷۸"
                                                    dir="ltr"
                                                    value={nationalCode}
                                                    onChange={(e) => setNationalCode(toOnlyDigits(e.target.value))}
                                                    className="w-full p-3.5 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden text-center text-base tracking-widest font-black"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="font-bold text-brand flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                                        <span>تاریخ تولد</span>
                                                    </label>
                                                    {userAge !== null && (
                                                        <span className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                            userAge < 18
                                                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        )}>
                                                            سن: {toPersianDigits(userAge)} سال
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleOpenDatePicker}
                                                    className={cn(
                                                        "w-full p-3.5 border rounded-xl flex items-center justify-between transition-all group cursor-pointer",
                                                        selectedYear && selectedMonth && selectedDay
                                                            ? "border-primary/50 bg-primary/5 hover:border-primary text-brand"
                                                            : "border-border-subtle bg-surface-secondary hover:border-primary/50 text-text-light"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Calendar className={cn(
                                                            "w-4 h-4 transition-colors",
                                                            selectedYear && selectedMonth && selectedDay ? "text-primary" : "text-secondary group-hover:text-primary"
                                                        )} />
                                                        <span className={cn(
                                                            "text-sm font-bold",
                                                            selectedYear && selectedMonth && selectedDay ? "text-brand font-black tracking-wider" : "text-text-light font-normal"
                                                        )}>
                                                            {selectedYear && selectedMonth && selectedDay
                                                                ? toPersianDigits(`${selectedYear} / ${String(selectedMonth).padStart(2, "0")} / ${String(selectedDay).padStart(2, "0")}`)
                                                                : "برای انتخاب تاریخ تولد کلیک کنید"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-primary font-bold bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors">
                                                        {selectedYear && selectedMonth && selectedDay ? "تغییر تاریخ" : "انتخاب تاریخ"}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-text-light leading-relaxed">
                                            اتباع محترم می‌توانند با وارد کردن کد فراگیر، شماره گذرنامه یا کارت آمایش، هویت حساب خود را احراز نمایند.
                                        </p>

                                        <div className="space-y-3.5 text-xs">
                                            <div>
                                                <label className="block font-bold text-brand mb-1.5">نوع مدرک هویتی</label>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {[
                                                        { id: ForeignIdType.FIDA, label: "کد فراگیر" },
                                                        { id: ForeignIdType.PASSPORT, label: "گذرنامه" },
                                                        { id: ForeignIdType.AMAYESH, label: "کارت آمایش" },
                                                    ].map((doc) => (
                                                        <button
                                                            key={doc.id}
                                                            type="button"
                                                            onClick={() => setForeignIdType(doc.id)}
                                                            className={cn(
                                                                "py-2 px-2 text-center rounded-xl border text-[11px] font-bold transition-all",
                                                                foreignIdType === doc.id
                                                                    ? "border-primary bg-primary/10 text-primary font-black"
                                                                    : "border-border-subtle bg-surface-secondary text-secondary hover:text-brand"
                                                            )}
                                                        >
                                                            {doc.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block font-bold text-brand mb-1.5">
                                                    {foreignIdType === ForeignIdType.FIDA
                                                        ? "کد فراگیر ۱۰ یا ۱۲ رقمی اتباع"
                                                        : foreignIdType === ForeignIdType.PASSPORT
                                                            ? "شماره گذرنامه معتبر"
                                                            : "شماره کارت آمایش"}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={foreignIdType === ForeignIdType.FIDA ? "مثلاً: 987654321012" : "شماره مدرک..."}
                                                    dir="ltr"
                                                    value={foreignId}
                                                    onChange={(e) => setForeignId(e.target.value.trim())}
                                                    className="w-full p-3.5 border border-border-subtle rounded-xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden text-center text-base tracking-wider font-black"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="font-bold text-brand flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                                        <span>تاریخ تولد</span>
                                                    </label>
                                                    {userAge !== null && (
                                                        <span className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                            userAge < 18
                                                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        )}>
                                                            سن: {toPersianDigits(userAge)} سال
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleOpenDatePicker}
                                                    className={cn(
                                                        "w-full p-3.5 border rounded-xl flex items-center justify-between transition-all group cursor-pointer",
                                                        selectedYear && selectedMonth && selectedDay
                                                            ? "border-primary/50 bg-primary/5 hover:border-primary text-brand"
                                                            : "border-border-subtle bg-surface-secondary hover:border-primary/50 text-text-light"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Calendar className={cn(
                                                            "w-4 h-4 transition-colors",
                                                            selectedYear && selectedMonth && selectedDay ? "text-primary" : "text-secondary group-hover:text-primary"
                                                        )} />
                                                        <span className={cn(
                                                            "text-sm font-bold",
                                                            selectedYear && selectedMonth && selectedDay ? "text-brand font-black tracking-wider" : "text-text-light font-normal"
                                                        )}>
                                                            {selectedYear && selectedMonth && selectedDay
                                                                ? toPersianDigits(`${selectedYear} / ${String(selectedMonth).padStart(2, "0")} / ${String(selectedDay).padStart(2, "0")}`)
                                                                : "برای انتخاب تاریخ تولد کلیک کنید"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-primary font-bold bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors">
                                                        {selectedYear && selectedMonth && selectedDay ? "تغییر تاریخ" : "انتخاب تاریخ"}
                                                    </span>
                                                </button>
                                            </div>

                                            <div>
                                                <MediaIconUpload
                                                    label="تصویر مدرک هویتی (گذرنامه، کارت آمایش یا برگه سرشماری)"
                                                    helperText="تصویر واضح با حداکثر حجم ۱۰ مگابایت"
                                                    value={documentUrl}
                                                    onChange={(mediaId) => setDocumentUrl(mediaId)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsKycModalOpen(false);
                                            setIsDatePickerView(false);
                                        }}
                                        className="flex-1 py-3 rounded-xl border border-border-subtle font-bold text-xs text-text-light hover:bg-surface-secondary"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => kycMutation.mutate()}
                                        disabled={
                                            kycMutation.isPending ||
                                            (citizenType === CitizenType.IRANIAN
                                                ? nationalCode.length !== 10 || !selectedYear || !selectedMonth || !selectedDay
                                                : foreignId.trim().length < 6)
                                        }
                                        className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {kycMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>
                                                    {citizenType === CitizenType.IRANIAN ? "استعلام شاهکار..." : "در حال ثبت مدارک..."}
                                                </span>
                                            </>
                                        ) : (
                                            <span>
                                                {citizenType === CitizenType.IRANIAN ? "استعلام و تایید هویت" : "ثبت و ارسال جهت بررسی"}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
