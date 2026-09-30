"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownLeft,
    Gift,
    ShieldAlert,
    ShieldCheck,
    Search,
    Filter,
    RefreshCw,
    Eye,
    User,
    Users,
    Phone,
    Calendar,

    Clock,
    DollarSign,
    CreditCard,
    Lock,
    Unlock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    SlidersHorizontal,
    ArrowUpDown,
    PlusCircle,
    MinusCircle,
    X,
    FileText,
    Activity,
    Landmark,
    UserCheck,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
    AdminTransactionItem,
    AdminUserWalletItem,
    AdjustWalletRequest,
    GiftCreditRequest,
} from "@/types/api/admin.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { formatCurrency, toPersianDigits } from "@/lib/utils";

// Format Rial to Toman
function formatRialToToman(rialAmount: string | number | undefined | null): string {
    if (!rialAmount) return "۰ تومان";
    const num = typeof rialAmount === "string" ? parseFloat(rialAmount) : rialAmount;
    if (isNaN(num) || num === 0) return "۰ تومان";
    const toman = Math.floor(num / 10);
    return `${new Intl.NumberFormat("fa-IR").format(toman)} تومان`;
}

function formatRials(rialAmount: string | number | undefined | null): string {
    if (!rialAmount) return "۰ ریال";
    const num = typeof rialAmount === "string" ? parseFloat(rialAmount) : rialAmount;
    if (isNaN(num) || num === 0) return "۰ ریال";
    return `${new Intl.NumberFormat("fa-IR").format(num)} ریال`;
}

function formatPersianDate(dateString?: string | Date | null): string {
    if (!dateString) return "نامشخص";
    try {
        const d = new Date(dateString);
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return String(dateString);
    }
}

function AdminWalletDashboard() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const queryUserId = searchParams.get("userId") || "";

    const { isSuperAdmin, hasPermission, isLoading: permissionsLoading } = useAdminPermissions();
    const canManageWallet = isSuperAdmin || hasPermission("wallet.manage");

    // Active Tab
    const [activeTab, setActiveTab] = useState<"transactions" | "users" | "manual-operation">(
        queryUserId ? "manual-operation" : "transactions"
    );

    // ── Ledger Filters (Tab 1) ────────────────────────────────────────────────
    const [txSearch, setTxSearch] = useState("");
    const [txType, setTxType] = useState<string>("ALL");
    const [txStatus, setTxStatus] = useState<string>("ALL");
    const [txChannel, setTxChannel] = useState<string>("ALL");
    const [txDatePreset, setTxDatePreset] = useState<string>("ALL");
    const [txSort, setTxSort] = useState<string>("createdAt_DESC");
    const [txPage, setTxPage] = useState<number>(1);
    const [txLimit] = useState<number>(15);
    const [minAmount, setMinAmount] = useState<string>("");
    const [maxAmount, setMaxAmount] = useState<string>("");

    // Calculate dates from preset
    const { fromDate, toDate } = useMemo(() => {
        if (txDatePreset === "TODAY") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return { fromDate: today.toISOString(), toDate: undefined };
        }
        if (txDatePreset === "7DAYS") {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return { fromDate: d.toISOString(), toDate: undefined };
        }
        if (txDatePreset === "30DAYS") {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return { fromDate: d.toISOString(), toDate: undefined };
        }
        return { fromDate: undefined, toDate: undefined };
    }, [txDatePreset]);

    // ── Users List Filters (Tab 2) ────────────────────────────────────────────
    const [userSearch, setUserSearch] = useState("");
    const [userHasBalanceOnly, setUserHasBalanceOnly] = useState(false);
    const [userFrozenOnly, setUserFrozenOnly] = useState(false);
    const [userSort, setUserSort] = useState("balance_DESC");
    const [userPage, setUserPage] = useState(1);
    const [userLimit] = useState(15);

    // ── Manual Operations State (Tab 3 & Modals) ──────────────────────────────
    const [operationType, setOperationType] = useState<"GIFT" | "CREDIT" | "DEBIT">("GIFT");
    const [targetUserId, setTargetUserId] = useState(queryUserId);
    const [targetUserSelected, setTargetUserSelected] = useState<{
        id: string;
        fullName: string;
        mobileNumber: string;
        balance?: string;
    } | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [manualAmount, setManualAmount] = useState("");
    const [manualNote, setManualNote] = useState("");
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // ── Modal & Drawer States ─────────────────────────────────────────────────
    const [selectedTx, setSelectedTx] = useState<AdminTransactionItem | null>(null);
    const [detailDrawerUserId, setDetailDrawerUserId] = useState<string | null>(null);
    const [freezeModalUser, setFreezeModalUser] = useState<AdminUserWalletItem | null>(null);
    const [freezeReason, setFreezeReason] = useState("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        toast.success("کپی شد");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // ── 1. Financial Summary Query ────────────────────────────────────────────
    const {
        data: summaryData,
        isLoading: isSummaryLoading,
        refetch: refetchSummary,
    } = useQuery({
        queryKey: ["admin-financial-summary"],
        queryFn: () => adminService.getFinancialSummary(),
        enabled: canManageWallet,
        staleTime: 30000,
    });

    // ── 2. Ledger Transactions Query ──────────────────────────────────────────
    const {
        data: txData,
        isLoading: isTxLoading,
        isFetching: isTxFetching,
        refetch: refetchTx,
    } = useQuery({
        queryKey: [
            "admin-wallet-transactions",
            txSearch,
            txType,
            txStatus,
            txChannel,
            fromDate,
            toDate,
            minAmount,
            maxAmount,
            txSort,
            txPage,
            txLimit,
        ],
        queryFn: () =>
            adminService.listTransactions({
                search: txSearch.trim() || undefined,
                type: txType !== "ALL" ? txType : undefined,
                status: txStatus !== "ALL" ? txStatus : undefined,
                channel: txChannel !== "ALL" ? txChannel : undefined,
                fromDate,
                toDate,
                minAmount: minAmount ? parseInt(minAmount.replace(/[^\d]/g, ""), 10) : undefined,
                maxAmount: maxAmount ? parseInt(maxAmount.replace(/[^\d]/g, ""), 10) : undefined,
                sort: txSort,
                page: txPage,
                limit: txLimit,
            }),
        enabled: canManageWallet && activeTab === "transactions",
    });

    // ── 3. Users Wallets Query ────────────────────────────────────────────────
    const {
        data: usersData,
        isLoading: isUsersLoading,
        isFetching: isUsersFetching,
        refetch: refetchUsers,
    } = useQuery({
        queryKey: [
            "admin-wallet-users",
            userSearch,
            userHasBalanceOnly,
            userFrozenOnly,
            userSort,
            userPage,
            userLimit,
        ],
        queryFn: () =>
            adminService.listUserWallets({
                search: userSearch.trim() || undefined,
                hasBalanceOnly: userHasBalanceOnly || undefined,
                isFrozen: userFrozenOnly ? true : undefined,
                sort: userSort,
                page: userPage,
                limit: userLimit,
            }),
        enabled: canManageWallet && activeTab === "users",
    });

    // ── 4. Single User Detail Drawer Query ────────────────────────────────────
    const {
        data: userDetailData,
        isLoading: isUserDetailLoading,
        refetch: refetchUserDetail,
    } = useQuery({
        queryKey: ["admin-user-wallet-detail", detailDrawerUserId],
        queryFn: () => adminService.getUserWalletDetail(detailDrawerUserId!),
        enabled: canManageWallet && Boolean(detailDrawerUserId),
    });

    // ── 5. Live User Autocomplete Search for Operations ───────────────────────
    const {
        data: searchedUsersData,
        isLoading: isSearchingUsers,
    } = useQuery({
        queryKey: ["admin-wallet-users-autocomplete", userSearchTerm],
        queryFn: () => adminService.listUserWallets({ search: userSearchTerm.trim(), limit: 8 }),
        enabled: canManageWallet && userSearchTerm.trim().length >= 2,
        staleTime: 5000,
    });

    // ── 6. Initial Lookup from URL Query ──────────────────────────────────────
    useQuery({
        queryKey: ["admin-user-initial-lookup", queryUserId],
        queryFn: async () => {
            const res = await adminService.getUserWalletDetail(queryUserId);
            if (res && res.user) {
                setTargetUserId(res.user.id);
                setTargetUserSelected({
                    id: res.user.id,
                    fullName: res.user.fullName,
                    mobileNumber: res.user.mobileNumber,
                    balance: res.wallet.balance,
                });
            }
            return res;
        },
        enabled: Boolean(queryUserId) && !targetUserSelected,
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const giftMutation = useMutation({
        mutationFn: (data: GiftCreditRequest) => adminService.giftCredit(data),
        onSuccess: () => {
            toast.success("اعتبار هدیه با موفقیت به کاربر تخصیص داده شد");
            setManualAmount("");
            setManualNote("");
            setConfirmModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
            queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-wallet-users"] });
            if (detailDrawerUserId) {
                queryClient.invalidateQueries({ queryKey: ["admin-user-wallet-detail", detailDrawerUserId] });
            }
        },
        onError: (err) => {
            toast.error(normalizeApiError(err, "خطا در تخصیص اعتبار هدیه"));
        },
    });

    const adjustMutation = useMutation({
        mutationFn: (data: AdjustWalletRequest) => adminService.adjustWallet(data),
        onSuccess: () => {
            toast.success("تراکنش تغییر موجودی با موفقیت اعمال شد");
            setManualAmount("");
            setManualNote("");
            setConfirmModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
            queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-wallet-users"] });
            if (detailDrawerUserId) {
                queryClient.invalidateQueries({ queryKey: ["admin-user-wallet-detail", detailDrawerUserId] });
            }
        },
        onError: (err) => {
            toast.error(normalizeApiError(err, "خطا در انجام تغییر تراز مالی"));
        },
    });

    const freezeMutation = useMutation({
        mutationFn: ({ userId, freeze, reason }: { userId: string; freeze: boolean; reason?: string }) =>
            adminService.toggleWalletFreeze(userId, { freeze, reason }),
        onSuccess: (_, vars) => {
            toast.success(vars.freeze ? "کیف پول کاربر با موفقیت مسدود گردید" : "مسدودیت کیف پول کاربر رفع شد");
            setFreezeModalUser(null);
            setFreezeReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
            queryClient.invalidateQueries({ queryKey: ["admin-wallet-users"] });
            if (detailDrawerUserId) {
                queryClient.invalidateQueries({ queryKey: ["admin-user-wallet-detail", detailDrawerUserId] });
            }
        },
        onError: (err) => {
            toast.error(normalizeApiError(err, "خطا در تغییر وضعیت مسدودی کیف پول"));
        },
    });

    const handleExecuteManualOperation = () => {
        const cleanAmount = parseInt(manualAmount.replace(/[^\d]/g, ""), 10);
        if (!targetUserId.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
            toast.error("لطفاً کاربر و مبلغ معتبر را مشخص کنید");
            return;
        }

        if (operationType === "GIFT") {
            giftMutation.mutate({
                targetUserId: targetUserId.trim(),
                amountRials: cleanAmount,
                note: manualNote.trim() || undefined,
            });
        } else {
            adjustMutation.mutate({
                targetUserId: targetUserId.trim(),
                type: operationType === "CREDIT" ? "CREDIT" : "DEBIT",
                amountRials: cleanAmount,
                note: manualNote.trim() || undefined,
            });
        }
    };

    const handleOpenQuickCharge = (user: AdminUserWalletItem, opType: "GIFT" | "CREDIT" | "DEBIT" = "CREDIT") => {
        setTargetUserId(user.userId);
        setTargetUserSelected({
            id: user.userId,
            fullName: user.fullName,
            mobileNumber: user.mobileNumber,
            balance: user.balance,
        });
        setOperationType(opType);
        setActiveTab("manual-operation");
    };

    if (permissionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-secondary">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <p className="font-bold text-sm">در حال بارگذاری اطلاعات دسترسی...</p>
                </div>
            </div>
        );
    }

    if (!canManageWallet) {
        return (
            <div className="p-8 md:p-16 flex items-center justify-center min-h-[60vh]">
                <div className="bg-white border border-red-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-xl font-black text-slate-800">عدم دسترسی به بخش مالی</h2>
                    <p className="text-sm text-secondary leading-relaxed">
                        مشاهده و مدیریت کیف پول‌های مالی و تراکنش‌ها منحصراً در اختیار سوپر ادمین و مدیران دارای مجوز اختصاصی مالی است.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16" dir="rtl">
            {/* ── Top Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-soft-border p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900">مدیریت مالی و امور کیف پول</h1>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                                حسابداری جامع
                            </span>
                        </div>
                        <p className="text-sm text-secondary font-medium mt-1">
                            نظارت بر نقدینگی کاربران، دفتر کل تراکنش‌ها، اعتبارات هدیه و تسویه حساب‌ها
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            refetchSummary();
                            if (activeTab === "transactions") refetchTx();
                            if (activeTab === "users") refetchUsers();
                            toast.success("اطلاعات مالی بروزرسانی شد");
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-soft-border text-slate-700 hover:bg-slate-50 transition text-xs font-bold"
                    >
                        <RefreshCw className={`w-4 h-4 ${isTxFetching || isUsersFetching ? "animate-spin" : ""}`} />
                        <span>بروزرسانی</span>
                    </button>
                    <button
                        onClick={() => {
                            setTargetUserSelected(null);
                            setTargetUserId("");
                            setUserSearchTerm("");
                            setManualAmount("");
                            setManualNote("");
                            setOperationType("GIFT");
                            setActiveTab("manual-operation");
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black shadow-lg shadow-brand/20 hover:bg-primary/95 transition"
                    >
                        <Gift className="w-4 h-4" />
                        <span>شارژ / عملیات دستی</span>
                    </button>
                </div>
            </div>

            {/* ── Financial Stats Overview Cards ───────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total System Liquidity */}
                <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider block">نقدینگی در گردش کاربران</span>
                            <h3 className="text-2xl font-black mt-2 tracking-tight">
                                {formatRials(summaryData?.totalSystemLiquidity)}
                            </h3>
                            <p className="text-xs text-blue-200 mt-1 font-bold">
                                معادل: {formatRialToToman(summaryData?.totalSystemLiquidity)}
                            </p>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Landmark className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
                        <span>کیف‌های دارای اعتبار:</span>
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg">
                            {toPersianDigits(summaryData?.activeWalletsCount ?? 0)} از {toPersianDigits(summaryData?.totalWalletsCount ?? 0)}
                        </span>
                    </div>
                </div>

                {/* 2. Total Inflow / Credits */}
                <div className="bg-white border border-soft-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold text-secondary block">کل واریزی‌ها (بستانکار)</span>
                            <h3 className="text-2xl font-black text-emerald-600 mt-2 tracking-tight">
                                + {formatRials(summaryData?.totalCreditsAmount)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                {formatRialToToman(summaryData?.totalCreditsAmount)}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-soft-border flex items-center justify-between text-xs text-slate-600">
                        <span>واریزی امروز:</span>
                        <span className="font-bold text-emerald-700">
                            + {formatRials(summaryData?.todayCredits)}
                        </span>
                    </div>
                </div>

                {/* 3. Total Outflow / Debits */}
                <div className="bg-white border border-soft-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-rose-300 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold text-secondary block">کل مصارف سامانه (بدهکار)</span>
                            <h3 className="text-2xl font-black text-rose-600 mt-2 tracking-tight">
                                - {formatRials(summaryData?.totalDebitsAmount)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                {formatRialToToman(summaryData?.totalDebitsAmount)}
                            </p>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-soft-border flex items-center justify-between text-xs text-slate-600">
                        <span>مصارف امروز:</span>
                        <span className="font-bold text-rose-700">
                            - {formatRials(summaryData?.todayDebits)}
                        </span>
                    </div>
                </div>

                {/* 4. Total Gifts & Adjustments */}
                <div className="bg-white border border-soft-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold text-secondary block">اعتبارات هدیه و تعدیل مدیر</span>
                            <h3 className="text-2xl font-black text-purple-600 mt-2 tracking-tight">
                                {formatRials(summaryData?.totalGiftsAmount)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                {formatRialToToman(summaryData?.totalGiftsAmount)}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                            <Gift className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-soft-border flex items-center justify-between text-xs text-slate-600">
                        <span>کل تراکنش‌های موفق:</span>
                        <span className="font-bold text-slate-800">
                            {toPersianDigits(summaryData?.totalCompletedTransactions ?? 0)} فقره
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main Tab Navigation Bar ──────────────────────────────────── */}
            <div className="bg-white border border-soft-border p-2 rounded-2xl flex items-center gap-2 shadow-sm">
                <button
                    onClick={() => setActiveTab("transactions")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                        activeTab === "transactions"
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>دفتر کل تراکنش‌ها</span>
                    {txData?.total !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === "transactions" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                            {toPersianDigits(txData.total)}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("users")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                        activeTab === "users"
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>موجودی و حساب‌های کاربران</span>
                    {usersData?.total !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                            {toPersianDigits(usersData.total)}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("manual-operation")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
                        activeTab === "manual-operation"
                            ? "bg-primary text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>شارژ و تغییر موجودی دستی</span>
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TAB 1: دفتر کل تراکنش‌ها (Ledger & Accounting Filters)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "transactions" && (
                <div className="space-y-6">
                    {/* Filter Console */}
                    <div className="bg-white border border-soft-border p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-soft-border pb-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                <SlidersHorizontal className="w-4 h-4 text-primary" />
                                <span>فیلترهای پیشرفته حسابداری و جستجو</span>
                            </div>

                            <button
                                onClick={() => {
                                    setTxSearch("");
                                    setTxType("ALL");
                                    setTxStatus("ALL");
                                    setTxChannel("ALL");
                                    setTxDatePreset("ALL");
                                    setMinAmount("");
                                    setMaxAmount("");
                                    setTxSort("createdAt_DESC");
                                    setTxPage(1);
                                }}
                                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>پاکسازی فیلترها</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Search Input */}
                            <div className="space-y-1.5 lg:col-span-2">
                                <label className="text-xs font-bold text-slate-600">جستجوی هوشمند</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={txSearch}
                                        onChange={(e) => {
                                            setTxSearch(e.target.value);
                                            setTxPage(1);
                                        }}
                                        placeholder="شماره موبایل، نام کاربر، شناسه تراکنش، کد رهگیری، بابت..."
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">نوع تراکنش</label>
                                <select
                                    value={txType}
                                    onChange={(e) => {
                                        setTxType(e.target.value);
                                        setTxPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="ALL">همه انواع تراکنش</option>
                                    <option value="credit">واریز (بستانکار / +)</option>
                                    <option value="debit">برداشت / هزینه (بدهکار / -)</option>
                                    <option value="transfer">انتقال اعتبار</option>
                                    <option value="refund">استرداد وجه</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">وضعیت سند</label>
                                <select
                                    value={txStatus}
                                    onChange={(e) => {
                                        setTxStatus(e.target.value);
                                        setTxPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="ALL">همه وضعیت‌ها</option>
                                    <option value="completed">تکمیل شده (موفق)</option>
                                    <option value="pending">در انتظار پرداخت</option>
                                    <option value="failed">ناموفق / خطا</option>
                                    <option value="cancelled">لغو شده</option>
                                </select>
                            </div>

                            {/* Channel Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">کانال / مبدا تراکنش</label>
                                <select
                                    value={txChannel}
                                    onChange={(e) => {
                                        setTxChannel(e.target.value);
                                        setTxPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="ALL">همه کانال‌ها</option>
                                    <option value="GATEWAY">درگاه آنلاین شتاب (جیبیت)</option>
                                    <option value="ADMIN_GIFT">شارژ هدیه مدیریت</option>
                                    <option value="ADMIN_MANUAL">تعدیل دستی مدیر</option>
                                    <option value="SYSTEM">سیستمی (ارتقا آگهی / پلن)</option>
                                </select>
                            </div>

                            {/* Date Preset */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">بازه زمانی</label>
                                <select
                                    value={txDatePreset}
                                    onChange={(e) => {
                                        setTxDatePreset(e.target.value);
                                        setTxPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="ALL">همه زمان‌ها</option>
                                    <option value="TODAY">فقط امروز</option>
                                    <option value="7DAYS">۷ روز گذشته</option>
                                    <option value="30DAYS">۳۰ روز گذشته</option>
                                </select>
                            </div>

                            {/* Min Amount */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">حداقل مبلغ (ریال)</label>
                                <input
                                    type="text"
                                    value={minAmount}
                                    onChange={(e) => {
                                        setMinAmount(e.target.value);
                                        setTxPage(1);
                                    }}
                                    placeholder="مثلا: 100000"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-medium outline-none"
                                />
                            </div>

                            {/* Sort Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">مرتب‌سازی</label>
                                <select
                                    value={txSort}
                                    onChange={(e) => setTxSort(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="createdAt_DESC">جدیدترین تراکنش‌ها</option>
                                    <option value="createdAt_ASC">قدیمی‌ترین تراکنش‌ها</option>
                                    <option value="amount_DESC">بیشترین مبلغ</option>
                                    <option value="amount_ASC">کمترین مبلغ</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Summary Banner */}
                        {txData && (
                            <div className="pt-3 border-t border-soft-border flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-700">
                                <div>
                                    تعداد یافته‌ها: <span className="text-primary font-black">{toPersianDigits(txData.total)}</span> رکورد
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-1.5 text-emerald-700">
                                        <span>مجموع بستانکار فیلترشده:</span>
                                        <span>+ {formatRials(txData.filteredTotalCredit)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-rose-700">
                                        <span>مجموع بدهکار فیلترشده:</span>
                                        <span>- {formatRials(txData.filteredTotalDebit)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white border border-soft-border rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-soft-border text-secondary font-black">
                                        <th className="py-4 px-6">تاریخ و زمان</th>
                                        <th className="py-4 px-6">کاربر طرف حساب</th>
                                        <th className="py-4 px-6">کانال / مبدا</th>
                                        <th className="py-4 px-6">مبلغ و جهت</th>
                                        <th className="py-4 px-6">شرح / بابت</th>
                                        <th className="py-4 px-6">وضعیت</th>
                                        <th className="py-4 px-6">اقدام مدیر</th>
                                        <th className="py-4 px-6 text-center">مشاهده سند</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-soft-border font-medium text-slate-700">
                                    {isTxLoading ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-secondary">
                                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                                                در حال بارگذاری تراکنش‌ها...
                                            </td>
                                        </tr>
                                    ) : !txData?.items || txData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-secondary space-y-2">
                                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                                                <p className="font-bold">تراکنشی با مشخصات انتخابی یافت نشد</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        txData.items.map((tx) => {
                                            const isCredit = tx.type === "credit";
                                            return (
                                                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                                                    {/* Date */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">
                                                                {formatPersianDate(tx.createdAt)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                {tx.id.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* User */}
                                                    <td className="py-4 px-6">
                                                        <button
                                                            onClick={() => setDetailDrawerUserId(tx.userId)}
                                                            className="text-right group flex flex-col"
                                                        >
                                                            <span className="font-bold text-slate-900 group-hover:text-primary transition flex items-center gap-1">
                                                                {tx.userFullName}
                                                                <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
                                                                {toPersianDigits(tx.userMobile)}
                                                            </span>
                                                        </button>
                                                    </td>

                                                    {/* Channel Badge */}
                                                    <td className="py-4 px-6">
                                                        {tx.channel === "ADMIN_GIFT" && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                                                <Gift className="w-3 h-3" />
                                                                هدیه مدیریت
                                                            </span>
                                                        )}
                                                        {tx.channel === "ADMIN_MANUAL" && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                تعدیل دستی
                                                            </span>
                                                        )}
                                                        {tx.channel === "GATEWAY" && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                                                <CreditCard className="w-3 h-3" />
                                                                درگاه آنلاین
                                                            </span>
                                                        )}
                                                        {tx.channel === "SYSTEM" && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                                                                <Activity className="w-3 h-3" />
                                                                سیستمی
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Amount & Type */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className={`font-black text-sm flex items-center gap-1 ${
                                                                isCredit ? "text-emerald-600" : "text-rose-600"
                                                            }`}>
                                                                {isCredit ? (
                                                                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                                                                ) : (
                                                                    <ArrowDownLeft className="w-4 h-4 shrink-0" />
                                                                )}
                                                                {isCredit ? "+" : "-"} {formatRials(tx.amount)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold">
                                                                {formatRialToToman(tx.amount)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Reason */}
                                                    <td className="py-4 px-6 max-w-xs truncate" title={tx.reason}>
                                                        <span className="text-slate-700 text-xs">
                                                            {tx.reason || "—"}
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-4 px-6">
                                                        {tx.status === "completed" && (
                                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                موفق
                                                            </span>
                                                        )}
                                                        {tx.status === "pending" && (
                                                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs">
                                                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                                                در انتظار
                                                            </span>
                                                        )}
                                                        {tx.status === "failed" && (
                                                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                ناموفق
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Admin Info */}
                                                    <td className="py-4 px-6">
                                                        {tx.adminFullName ? (
                                                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                                                                {tx.adminFullName}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            onClick={() => setSelectedTx(tx)}
                                                            className="p-2 rounded-xl border border-soft-border hover:bg-slate-100 text-slate-700 transition"
                                                            title="مشاهده سند تراکنش"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {txData && txData.totalPages > 1 && (
                            <div className="p-4 border-t border-soft-border flex items-center justify-between text-xs font-bold text-slate-600">
                                <div>
                                    صفحه {toPersianDigits(txPage)} از {toPersianDigits(txData.totalPages)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={txPage <= 1}
                                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                                        className="p-2 rounded-xl border border-soft-border disabled:opacity-40 hover:bg-slate-50 transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={txPage >= txData.totalPages}
                                        onClick={() => setTxPage((p) => p + 1)}
                                        className="p-2 rounded-xl border border-soft-border disabled:opacity-40 hover:bg-slate-50 transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 2: حساب‌ها و موجودی کاربران (User Balances & Search)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "users" && (
                <div className="space-y-6">
                    {/* User Search & Filter Bar */}
                    <div className="bg-white border border-soft-border p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* Search */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-slate-600">جستجوی کاربر</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setUserPage(1);
                                        }}
                                        placeholder="شماره موبایل، نام و نام خانوادگی، یا شناسه کاربری..."
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">مرتب‌سازی موجودی</label>
                                <select
                                    value={userSort}
                                    onChange={(e) => setUserSort(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="balance_DESC">بیشترین موجودی کیف پول</option>
                                    <option value="balance_ASC">کمترین موجودی کیف پول</option>
                                    <option value="transactions_DESC">بیشترین تراکنش مالی</option>
                                    <option value="createdAt_DESC">جدیدترین کاربران</option>
                                </select>
                            </div>

                            {/* Checkboxes */}
                            <div className="flex items-center gap-4 py-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={userHasBalanceOnly}
                                        onChange={(e) => {
                                            setUserHasBalanceOnly(e.target.checked);
                                            setUserPage(1);
                                        }}
                                        className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                                    />
                                    <span>فقط دارای موجودی (&gt; ۰)</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={userFrozenOnly}
                                        onChange={(e) => {
                                            setUserFrozenOnly(e.target.checked);
                                            setUserPage(1);
                                        }}
                                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                                    />
                                    <span>مسدود شده‌ها</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white border border-soft-border rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-soft-border text-secondary font-black">
                                        <th className="py-4 px-6">کاربر</th>
                                        <th className="py-4 px-6">موجودی کیف پول</th>
                                        <th className="py-4 px-6">وضعیت کیف</th>
                                        <th className="py-4 px-6">گردش حساب (واریز / مصرف)</th>
                                        <th className="py-4 px-6">تعداد تراکنش</th>
                                        <th className="py-4 px-6">آخرین تراکنش</th>
                                        <th className="py-4 px-6 text-center">عملیات مالی</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-soft-border font-medium text-slate-700">
                                    {isUsersLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-secondary">
                                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                                                در حال بارگذاری حساب‌های کاربران...
                                            </td>
                                        </tr>
                                    ) : !usersData?.items || usersData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-secondary space-y-2">
                                                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                                                <p className="font-bold">کاربری با این مشخصات یافت نشد</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        usersData.items.map((u) => {
                                            const hasPositiveBalance = parseFloat(u.balance) > 0;
                                            return (
                                                <tr key={u.userId} className="hover:bg-slate-50/80 transition">
                                                    {/* User Info */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-sm shrink-0">
                                                                {u.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                                    <span>{u.fullName}</span>
                                                                    {u.kycStatus === "Verified" && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                            احراز هویت
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-slate-500 font-mono block mt-0.5" dir="ltr">
                                                                    {toPersianDigits(u.mobileNumber)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Balance */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-black ${
                                                                hasPositiveBalance ? "text-slate-900" : "text-slate-400"
                                                            }`}>
                                                                {formatRials(u.balance)}
                                                            </span>
                                                            <span className="text-[10px] text-primary font-bold">
                                                                {formatRialToToman(u.balance)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Wallet Status */}
                                                    <td className="py-4 px-6">
                                                        {u.isFrozen ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                                                <Lock className="w-3 h-3" />
                                                                مسدود شده
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                فعال
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Turnover */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col gap-0.5 text-[11px]">
                                                            <span className="text-emerald-700 font-bold">
                                                                + {formatRials(u.totalDeposited)}
                                                            </span>
                                                            <span className="text-rose-700 font-bold">
                                                                - {formatRials(u.totalSpent)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Transactions Count */}
                                                    <td className="py-4 px-6">
                                                        <span className="font-bold text-slate-800">
                                                            {toPersianDigits(u.transactionsCount)} تراکنش
                                                        </span>
                                                    </td>

                                                    {/* Last Activity */}
                                                    <td className="py-4 px-6">
                                                        <span className="text-slate-500 text-[11px]">
                                                            {formatPersianDate(u.lastTransactionAt)}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Quick Charge / Adjust */}
                                                            <button
                                                                onClick={() => handleOpenQuickCharge(u, "GIFT")}
                                                                className="px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition text-xs font-black flex items-center gap-1"
                                                                title="شارژ اعتبار هدیه"
                                                            >
                                                                <Gift className="w-3.5 h-3.5" />
                                                                <span>هدیه</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenQuickCharge(u, "CREDIT")}
                                                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-xs font-bold"
                                                                title="شارژ / کسر دستی"
                                                            >
                                                                <span>تعدیل</span>
                                                            </button>

                                                            {/* Detail Drawer */}
                                                            <button
                                                                onClick={() => setDetailDrawerUserId(u.userId)}
                                                                className="p-1.5 rounded-xl border border-soft-border hover:bg-slate-100 text-slate-700 transition"
                                                                title="ریزگردش و سوابق مالی"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {/* Freeze Toggle */}
                                                            <button
                                                                onClick={() => setFreezeModalUser(u)}
                                                                className={`p-1.5 rounded-xl transition ${
                                                                    u.isFrozen
                                                                        ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                                                        : "border border-soft-border text-slate-500 hover:text-rose-600"
                                                                }`}
                                                                title={u.isFrozen ? "رفع مسدودیت" : "مسدود کردن کیف پول"}
                                                            >
                                                                {u.isFrozen ? (
                                                                    <Unlock className="w-4 h-4" />
                                                                ) : (
                                                                    <Lock className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {usersData && usersData.totalPages > 1 && (
                            <div className="p-4 border-t border-soft-border flex items-center justify-between text-xs font-bold text-slate-600">
                                <div>
                                    صفحه {toPersianDigits(userPage)} از {toPersianDigits(usersData.totalPages)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={userPage <= 1}
                                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                        className="p-2 rounded-xl border border-soft-border disabled:opacity-40 hover:bg-slate-50 transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={userPage >= usersData.totalPages}
                                        onClick={() => setUserPage((p) => p + 1)}
                                        className="p-2 rounded-xl border border-soft-border disabled:opacity-40 hover:bg-slate-50 transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 3: شارژ و تغییر موجودی دستی (Direct Action Form)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "manual-operation" && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white border border-soft-border rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-soft-border bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <PlusCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">عملیات شارژ و تعدیل مستقیم حساب</h3>
                                    <p className="text-xs text-secondary font-medium">افزایش، کاهش یا اهدای اعتبار به هر کاربر پلتفرم</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* 1. Select Operation Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700">نوع عملیات مالی</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setOperationType("GIFT")}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-xs font-black ${
                                            operationType === "GIFT"
                                                ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                                                : "border-soft-border text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Gift className="w-6 h-6 text-purple-600" />
                                        <span>شارژ هدیه (Gift)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setOperationType("CREDIT")}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-xs font-black ${
                                            operationType === "CREDIT"
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                                                : "border-soft-border text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                                        <span>واریز دستی (بستانکار)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setOperationType("DEBIT")}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-xs font-black ${
                                            operationType === "DEBIT"
                                                ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                                                : "border-soft-border text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <ArrowDownLeft className="w-6 h-6 text-rose-600" />
                                        <span>برداشت دستی (بدهکار)</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Target User Selection (Live Autocomplete & Rich Card) */}
                            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-soft-border">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-primary" />
                                        <span>انتخاب کاربر طرف حساب</span>
                                    </label>
                                    {targetUserSelected && (
                                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-bold">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            کاربر انتخاب شده
                                        </span>
                                    )}
                                </div>

                                {targetUserSelected ? (
                                    /* Selected User Card */
                                    <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                                                {targetUserSelected.fullName.charAt(0) || "ک"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-slate-900 text-sm">{targetUserSelected.fullName}</h4>
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono block mt-0.5" dir="ltr">
                                                    {toPersianDigits(targetUserSelected.mobileNumber)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            {targetUserSelected.balance !== undefined && (
                                                <div className="text-left bg-slate-50 px-3 py-1.5 rounded-xl border border-soft-border">
                                                    <span className="text-[10px] text-slate-400 block font-bold">موجودی فعلی:</span>
                                                    <span className="text-xs font-black text-emerald-700">{formatRials(targetUserSelected.balance)}</span>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setDetailDrawerUserId(targetUserSelected.id)}
                                                className="p-2 rounded-xl border border-soft-border hover:bg-slate-100 text-slate-600 transition"
                                                title="مشاهده پرونده مالی و تراکنش‌ها"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTargetUserSelected(null);
                                                    setTargetUserId("");
                                                    setUserSearchTerm("");
                                                    setIsSearchDropdownOpen(true);
                                                }}
                                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                <span>تغییر کاربر</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* User Live Search & Autocomplete */
                                    <div className="relative space-y-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={userSearchTerm}
                                                onChange={(e) => {
                                                    setUserSearchTerm(e.target.value);
                                                    setIsSearchDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsSearchDropdownOpen(true)}
                                                placeholder="جستجوی کاربر با نام یا شماره موبایل (مثلا: ۰۹۱۲ یا رضایی)..."
                                                className="w-full pl-10 pr-10 py-3.5 bg-white border border-soft-border rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition shadow-sm"
                                            />
                                            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
                                            {userSearchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUserSearchTerm("");
                                                        setIsSearchDropdownOpen(false);
                                                    }}
                                                    className="absolute left-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Autocomplete Dropdown */}
                                        {isSearchDropdownOpen && userSearchTerm.trim().length >= 2 && (
                                            <div className="absolute z-30 top-full mt-1 right-0 left-0 bg-white border border-soft-border rounded-2xl shadow-xl overflow-hidden divide-y divide-soft-border max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                                                {isSearchingUsers ? (
                                                    <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                                                        <span>در حال جستجوی کاربران...</span>
                                                    </div>
                                                ) : !searchedUsersData?.items || searchedUsersData.items.length === 0 ? (
                                                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                                                        <Users className="w-6 h-6 text-slate-300 mx-auto" />
                                                        <p className="font-bold">کاربری با این مشخصات یافت نشد</p>
                                                    </div>
                                                ) : (
                                                    searchedUsersData.items.map((u) => (
                                                        <button
                                                            key={u.userId}
                                                            type="button"
                                                            onClick={() => {
                                                                setTargetUserId(u.userId);
                                                                setTargetUserSelected({
                                                                    id: u.userId,
                                                                    fullName: u.fullName,
                                                                    mobileNumber: u.mobileNumber,
                                                                    balance: u.balance,
                                                                });
                                                                setUserSearchTerm("");
                                                                setIsSearchDropdownOpen(false);
                                                            }}
                                                            className="w-full p-3.5 text-right hover:bg-primary/5 transition flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary transition flex items-center justify-center font-bold text-slate-700 text-xs">
                                                                    {u.fullName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                                        <span>{u.fullName}</span>
                                                                        {u.kycStatus === "Verified" && (
                                                                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                                تایید هویت
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5" dir="ltr">
                                                                        {toPersianDigits(u.mobileNumber)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-left">
                                                                <span className="text-[10px] text-slate-400 block font-bold">موجودی:</span>
                                                                <span className="text-xs font-black text-slate-800 group-hover:text-primary transition">
                                                                    {formatRials(u.balance)}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {/* Quick Helper / Shortcut to Users Tab */}
                                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                                            <span>کاربر مورد نظر را از کادر بالا جستجو و انتخاب نمایید.</span>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab("users")}
                                                className="text-primary hover:underline font-bold flex items-center gap-1"
                                            >
                                                <Users className="w-3.5 h-3.5" />
                                                <span>انتخاب از فهرست حساب‌های کاربران</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Amount & Quick Presets */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700">مبلغ تراکنش (ریال)</label>
                                <input
                                    type="text"
                                    value={manualAmount ? formatCurrency(parseInt(manualAmount.replace(/[^\d]/g, ""), 10) || 0) : ""}
                                    onChange={(e) => setManualAmount(e.target.value.replace(/[^\d]/g, ""))}
                                    placeholder="مبلغ را به ریال وارد کنید"
                                    className="w-full px-4 py-3 bg-white border border-soft-border rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                />

                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {[500000, 1000000, 2500000, 5000000, 10000000, 50000000].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setManualAmount(String(preset))}
                                            className="px-3 py-1.5 rounded-lg border border-soft-border text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition"
                                        >
                                            {formatRialToToman(preset)}
                                        </button>
                                    ))}
                                </div>

                                {manualAmount && (
                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-blue-900 mt-2">
                                        <span>معادل به تومان:</span>
                                        <span className="text-sm font-black">{formatRialToToman(manualAmount)}</span>
                                    </div>
                                )}
                            </div>

                            {/* 4. Note / Reason */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700">شرح / دلیل تراکنش (ثبت در دفتر حسابداری)</label>
                                <input
                                    type="text"
                                    value={manualNote}
                                    onChange={(e) => setManualNote(e.target.value)}
                                    placeholder="علت اعمال این تراکنش (مثلا: هدیه ثبت‌نام ویژه، اصلاح سند مالی شماره ...)"
                                    className="w-full px-4 py-3 bg-white border border-soft-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                />
                            </div>

                            {/* Warning Box */}
                            <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs border border-amber-200">
                                <Info className="shrink-0 mt-0.5 text-amber-600" size={18} />
                                <p className="leading-relaxed">
                                    تراکنش‌های ثبت شده توسط مدیر مستقیماً روی مانده حساب کاربر اعمال می‌شوند و به عنوان سند حسابداری با شناسه مدیر ثبت می‌گردند.
                                    در صورت عدم وجود کیف پول قبلی برای کاربر، کیف پول به صورت خودکار ایجاد و شارژ می‌گردد.
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cleanAmount = parseInt(manualAmount.replace(/[^\d]/g, ""), 10);
                                        if (!targetUserId.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
                                            toast.error("لطفا کاربر و مبلغ معتبر را مشخص کنید");
                                            return;
                                        }
                                        setConfirmModalOpen(true);
                                    }}
                                    disabled={giftMutation.isPending || adjustMutation.isPending}
                                    className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-primary/95 transition shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>بررسی و تایید تراکنش</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: تایید نهایی تراکنش دستی (Double Confirmation)
            ══════════════════════════════════════════════════════════════════ */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-soft-border pb-4">
                            <h3 className="text-base font-black text-slate-900">تایید نهایی عملیات مالی</h3>
                            <button
                                onClick={() => setConfirmModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-soft-border">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">نوع عملیات:</span>
                                    <span className="font-bold text-slate-900">
                                        {operationType === "GIFT" && "شارژ هدیه مدیریت"}
                                        {operationType === "CREDIT" && "واریز دستی (بستانکار)"}
                                        {operationType === "DEBIT" && "برداشت دستی (بدهکار)"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">کاربر مقصد:</span>
                                    <span className="font-bold text-slate-900">
                                        {targetUserSelected?.fullName || targetUserId}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">مبلغ ریالی:</span>
                                    <span className="font-black text-sm text-primary">
                                        {formatRials(manualAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">معادل تومان:</span>
                                    <span className="font-bold text-slate-700">
                                        {formatRialToToman(manualAmount)}
                                    </span>
                                </div>
                                {manualNote && (
                                    <div className="flex justify-between border-t border-slate-200 pt-2">
                                        <span className="text-slate-500">شرح سند:</span>
                                        <span className="text-slate-700 max-w-[200px] truncate">{manualNote}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModalOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-soft-border font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteManualOperation}
                                disabled={giftMutation.isPending || adjustMutation.isPending}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/95 transition shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {giftMutation.isPending || adjustMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span>ثبت و اجرا</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: مشاهده سند کامل تراکنش (Transaction Receipt Modal)
            ══════════════════════════════════════════════════════════════════ */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-soft-border pb-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <FileText className="w-5 h-5 text-primary" />
                                <span>رسید رسمی و اطلاعات تراکنش</span>
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Receipt Card */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-soft-border space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                    <span className="text-slate-500">مبلغ تراکنش:</span>
                                    <div className="text-left">
                                        <span className={`text-lg font-black block ${
                                            selectedTx.type === "credit" ? "text-emerald-600" : "text-rose-600"
                                        }`}>
                                            {selectedTx.type === "credit" ? "+" : "-"} {formatRials(selectedTx.amount)}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-bold">
                                            {formatRialToToman(selectedTx.amount)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">شناسه تراکنش (ID):</span>
                                    <div className="flex items-center gap-1 font-mono text-slate-800">
                                        <span>{selectedTx.id}</span>
                                        <button onClick={() => handleCopy(selectedTx.id, "tx-id")}>
                                            {copiedKey === "tx-id" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">کلید یکتایی (Idempotency Key):</span>
                                    <span className="font-mono text-slate-700 truncate max-w-[220px]" title={selectedTx.idempotencyKey}>
                                        {selectedTx.idempotencyKey}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">تاریخ و زمان ثبت:</span>
                                    <span className="font-bold text-slate-800">{formatPersianDate(selectedTx.createdAt)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">وضعیت سند:</span>
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {selectedTx.status === "completed" ? "تکمیل شده / موفق" : selectedTx.status}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">کانال پردازش:</span>
                                    <span className="font-bold text-slate-800">{selectedTx.channel}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-500">بابت / شرح:</span>
                                    <span className="font-bold text-slate-800">{selectedTx.reason || "—"}</span>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-900 block">مشخصات کاربر طرف حساب</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDetailDrawerUserId(selectedTx.userId);
                                                setSelectedTx(null);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition text-[10px] font-bold flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>پرونده مالی</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTargetUserId(selectedTx.userId);
                                                setTargetUserSelected({
                                                    id: selectedTx.userId,
                                                    fullName: selectedTx.userFullName,
                                                    mobileNumber: selectedTx.userMobile,
                                                });
                                                setOperationType("GIFT");
                                                setSelectedTx(null);
                                                setActiveTab("manual-operation");
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 transition text-[10px] font-bold flex items-center gap-1"
                                        >
                                            <Gift className="w-3 h-3" />
                                            <span>شارژ / عملیات</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">نام کاربر:</span>
                                    <span className="font-bold text-slate-900">{selectedTx.userFullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">شماره تماس:</span>
                                    <span className="font-mono font-bold text-slate-800">{toPersianDigits(selectedTx.userMobile)}</span>
                                </div>
                            </div>

                            {/* Admin Info if any */}
                            {selectedTx.adminFullName && (
                                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2">
                                    <span className="text-xs font-bold text-purple-900 block">مدیر اقدام‌کننده</span>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">نام مدیر:</span>
                                        <span className="font-bold text-slate-900">{selectedTx.adminFullName}</span>
                                    </div>
                                    {selectedTx.adminMobile && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">موبایل مدیر:</span>
                                            <span className="font-mono text-slate-800">{toPersianDigits(selectedTx.adminMobile)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Metadata JSON */}
                            {selectedTx.metadata && Object.keys(selectedTx.metadata).length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600">متادیتای سیستمی (JSON):</span>
                                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36">
                                        {JSON.stringify(selectedTx.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                            >
                                بستن رسید
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                DRAWER: ریزگردش و پرونده مالی کاربر (User Financial Sheet Drawer)
            ══════════════════════════════════════════════════════════════════ */}
            {detailDrawerUserId && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
                    <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-soft-border flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">
                                        پرونده مالی: {userDetailData?.user.fullName || "در حال دریافت..."}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                                        {toPersianDigits(userDetailData?.user.mobileNumber || "")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDetailDrawerUserId(null)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                            {isUserDetailLoading ? (
                                <div className="py-20 text-center text-secondary">
                                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
                                    در حال دریافت پرونده مالی کاربر...
                                </div>
                            ) : !userDetailData ? (
                                <div className="text-center py-12 text-slate-400">اطلاعاتی یافت نشد</div>
                            ) : (
                                <>
                                    {/* User Balance Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
                                            <span className="text-[10px] text-slate-300 font-bold block">موجودی قابل استفاده</span>
                                            <h4 className="text-xl font-black text-emerald-400">
                                                {formatRials(userDetailData.wallet.balance)}
                                            </h4>
                                            <span className="text-[10px] text-slate-300 block">
                                                {formatRialToToman(userDetailData.wallet.balance)}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 border border-soft-border p-4 rounded-2xl space-y-1">
                                            <span className="text-[10px] text-slate-500 font-bold block">مجموع کل واریزها</span>
                                            <h4 className="text-xl font-black text-slate-800">
                                                {formatRials(userDetailData.stats.totalDeposited)}
                                            </h4>
                                            <span className="text-[10px] text-slate-500 block">
                                                کل مصارف: {formatRials(userDetailData.stats.totalSpent)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setTargetUserId(userDetailData.user.id);
                                                setTargetUserSelected({
                                                    id: userDetailData.user.id,
                                                    fullName: userDetailData.user.fullName,
                                                    mobileNumber: userDetailData.user.mobileNumber,
                                                    balance: userDetailData.wallet.balance,
                                                });
                                                setOperationType("GIFT");
                                                setDetailDrawerUserId(null);
                                                setActiveTab("manual-operation");
                                            }}
                                            className="flex-1 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold hover:bg-purple-100 transition flex items-center justify-center gap-1.5"
                                        >
                                            <Gift className="w-4 h-4" />
                                            <span>اعطای شارژ هدیه</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setTargetUserId(userDetailData.user.id);
                                                setTargetUserSelected({
                                                    id: userDetailData.user.id,
                                                    fullName: userDetailData.user.fullName,
                                                    mobileNumber: userDetailData.user.mobileNumber,
                                                    balance: userDetailData.wallet.balance,
                                                });
                                                setOperationType("CREDIT");
                                                setDetailDrawerUserId(null);
                                                setActiveTab("manual-operation");
                                            }}
                                            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                            <span>تعدیل دستی موجودی</span>
                                        </button>
                                    </div>

                                    {/* Filter in Ledger Button */}
                                    <button
                                        onClick={() => {
                                            setTxSearch(userDetailData.user.mobileNumber || userDetailData.user.fullName);
                                            setTxPage(1);
                                            setDetailDrawerUserId(null);
                                            setActiveTab("transactions");
                                        }}
                                        className="w-full py-2.5 rounded-xl border border-soft-border hover:bg-slate-50 text-slate-700 font-bold transition flex items-center justify-center gap-1.5 text-xs"
                                    >
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span>مشاهده تمام تراکنش‌های این کاربر در دفتر کل</span>
                                    </button>

                                    {/* Recent User Transactions */}
                                    <div className="space-y-3">
                                        <h4 className="font-black text-slate-900 text-sm">آخرین تراکنش‌های ثبت شده کاربر</h4>
                                        <div className="border border-soft-border rounded-2xl overflow-hidden divide-y divide-soft-border">
                                            {userDetailData.recentTransactions.length === 0 ? (
                                                <div className="p-6 text-center text-slate-400">تراکنشی برای این کاربر ثبت نشده است</div>
                                            ) : (
                                                userDetailData.recentTransactions.map((tx) => (
                                                    <div key={tx.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-xl ${
                                                                tx.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                            }`}>
                                                                {tx.type === "credit" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-800 block">{tx.reason || "تراکنش مالی"}</span>
                                                                <span className="text-[10px] text-slate-400">{formatPersianDate(tx.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-left">
                                                            <span className={`font-black text-xs block ${
                                                                tx.type === "credit" ? "text-emerald-600" : "text-rose-600"
                                                            }`}>
                                                                {tx.type === "credit" ? "+" : "-"} {formatRials(tx.amount)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">{formatRialToToman(tx.amount)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: مسدودسازی / رفع مسدودیت کیف پول
            ══════════════════════════════════════════════════════════════════ */}
            {freezeModalUser && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-soft-border pb-4">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                                {freezeModalUser.isFrozen ? <Unlock className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-rose-600" />}
                                <span>{freezeModalUser.isFrozen ? "رفع مسدودیت کیف پول" : "مسدودسازی کیف پول"}</span>
                            </div>
                            <button
                                onClick={() => setFreezeModalUser(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <p className="text-slate-600 leading-relaxed">
                                {freezeModalUser.isFrozen
                                    ? `آیا از فعال‌سازی مجدد و رفع مسدودیت کیف پول کاربر ${freezeModalUser.fullName} اطمینان دارید؟`
                                    : `با مسدودسازی کیف پول کاربر ${freezeModalUser.fullName}، امکان واریز و برداشت وجه تا زمان رفع مسدودیت متوقف خواهد شد.`}
                            </p>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">علت مسدودسازی / رفع مسدودیت (اختیاری)</label>
                                <input
                                    type="text"
                                    value={freezeReason}
                                    onChange={(e) => setFreezeReason(e.target.value)}
                                    placeholder="مثلا: استعلام تخلف، درخواست کاربر و..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-soft-border rounded-xl text-xs outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setFreezeModalUser(null)}
                                className="flex-1 py-2.5 rounded-xl border border-soft-border font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    freezeMutation.mutate({
                                        userId: freezeModalUser.userId,
                                        freeze: !freezeModalUser.isFrozen,
                                        reason: freezeReason.trim() || undefined,
                                    })
                                }
                                disabled={freezeMutation.isPending}
                                className={`flex-1 py-2.5 rounded-xl text-white font-black text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 ${
                                    freezeModalUser.isFrozen ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                }`}
                            >
                                {freezeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                <span>{freezeModalUser.isFrozen ? "رفع مسدودیت" : "مسدود کردن"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminWalletPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-gray-400 font-bold">در حال بارگذاری داشبورد مالی...</div>}>
            <AdminWalletDashboard />
        </Suspense>
    );
}
