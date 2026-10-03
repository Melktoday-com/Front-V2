"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
    ShieldCheck,
    UserPlus,
    Key,
    UserX,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Lock,
    Unlock,
    Users,
    Phone,
    Calendar,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    Check,
    X,
} from "lucide-react";
import { toast } from "sonner";
import {
    AdminListItem,
    PermissionDefinition,
} from "@/types/api/admin.types";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toPersianDigits } from "@/lib/utils";

export default function AdminsManagementPage() {
    const queryClient = useQueryClient();
    const { isSuperAdmin, hasPermission, isLoading: permissionsLoading } = useAdminPermissions();

    // Search and filter
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminListItem | null>(null);

    // Form states
    const [createPhone, setCreatePhone] = useState("");
    const [createFirstName, setCreateFirstName] = useState("");
    const [createLastName, setCreateLastName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [revokeReason, setRevokeReason] = useState("");

    // Fetch admins list
    const {
        data: adminsData,
        isLoading: isAdminsLoading,
        isFetching: isAdminsFetching,
        refetch: refetchAdmins,
    } = useQuery({
        queryKey: ["admin-admins-list"],
        queryFn: () => adminService.listAdmins(),
        enabled: isSuperAdmin,
    });

    // Fetch available permissions
    const {
        data: availablePermissions = [],
        isLoading: isPermissionsLoading,
    } = useQuery({
        queryKey: ["admin-available-permissions"],
        queryFn: () => adminService.getAvailablePermissions(),
    });

    // Group permissions by category
    const permissionsByCategory = useMemo(() => {
        const groups: Record<string, PermissionDefinition[]> = {};
        for (const perm of availablePermissions) {
            if (!groups[perm.category]) {
                groups[perm.category] = [];
            }
            groups[perm.category].push(perm);
        }
        return groups;
    }, [availablePermissions]);

    // Filter admins
    const filteredAdmins = useMemo(() => {
        if (!adminsData?.items) return [];
        if (!searchQuery.trim()) return adminsData.items;

        const q = searchQuery.toLowerCase().trim();
        return adminsData.items.filter(
            (adm) =>
                adm.phoneNumber.toLowerCase().includes(q) ||
                (adm.firstName && adm.firstName.toLowerCase().includes(q)) ||
                (adm.lastName && adm.lastName.toLowerCase().includes(q))
        );
    }, [adminsData, searchQuery]);

    // Mutation: Create Admin
    const createMutation = useMutation({
        mutationFn: adminService.createAdmin,
        onSuccess: (newAdmin) => {
            toast.success(`دسترسی مدیریت برای ${newAdmin.phoneNumber} با موفقیت ثبت شد.`);
            setIsCreateModalOpen(false);
            setCreatePhone("");
            setCreateFirstName("");
            setCreateLastName("");
            setSelectedPermissions([]);
            queryClient.invalidateQueries({ queryKey: ["admin-admins-list"] });
        },
        onError: (err) => {
            toast.error(normalizeApiError(err));
        },
    });

    // Mutation: Update Permissions
    const updatePermissionsMutation = useMutation({
        mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
            adminService.updateAdminPermissions(userId, { permissions }),
        onSuccess: () => {
            toast.success("سطح دسترسی‌های مدیر با موفقیت به‌روزرسانی شد.");
            setIsEditModalOpen(false);
            setSelectedAdmin(null);
            setSelectedPermissions([]);
            queryClient.invalidateQueries({ queryKey: ["admin-admins-list"] });
        },
        onError: (err) => {
            toast.error(normalizeApiError(err));
        },
    });

    // Mutation: Revoke Admin
    const revokeMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
            adminService.revokeAdmin(userId, reason),
        onSuccess: () => {
            toast.success("دسترسی مدیریت با موفقیت لغو شد.");
            setIsRevokeModalOpen(false);
            setSelectedAdmin(null);
            setRevokeReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-admins-list"] });
        },
        onError: (err) => {
            toast.error(normalizeApiError(err));
        },
    });

    // Modal openers
    const handleOpenCreateModal = () => {
        setCreatePhone("");
        setCreateFirstName("");
        setCreateLastName("");
        setSelectedPermissions([]);
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (admin: AdminListItem) => {
        setSelectedAdmin(admin);
        setSelectedPermissions(admin.permissions || []);
        setIsEditModalOpen(true);
    };

    const handleOpenRevokeModal = (admin: AdminListItem) => {
        setSelectedAdmin(admin);
        setRevokeReason("");
        setIsRevokeModalOpen(true);
    };

    // Permission selection toggles
    const togglePermission = (key: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );
    };

    const toggleCategoryAll = (categoryPerms: PermissionDefinition[]) => {
        const keys = categoryPerms.map((p) => p.key);
        const allSelected = keys.every((k) => selectedPermissions.includes(k));

        if (allSelected) {
            setSelectedPermissions((prev) => prev.filter((k) => !keys.includes(k)));
        } else {
            setSelectedPermissions((prev) => Array.from(new Set([...prev, ...keys])));
        }
    };

    const isCategoryAllSelected = (categoryPerms: PermissionDefinition[]) => {
        const keys = categoryPerms.map((p) => p.key);
        return keys.length > 0 && keys.every((k) => selectedPermissions.includes(k));
    };

    // Access check
    if (!permissionsLoading && !isSuperAdmin) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center" dir="rtl">
                <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-sm">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-red-800 mb-2">عدم دسترسی به بخش مدیریت مدیران</h2>
                    <p className="text-sm text-red-600 leading-relaxed">
                        این بخش منحصراً در اختیار «مدیر ارشد» (Super Admin) پلتفرم است و سایر مدیران به مدیریت سطوح دسترسی مدیران دسترسی ندارند.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-soft-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">مدیریت مدیران و سطوح دسترسی</h1>
                        <p className="text-sm text-secondary mt-1">
                            تعریف مدیر جدید، انتساب و ویرایش دسترسی‌های دانه‌ای (Granular Permissions)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetchAdmins()}
                        disabled={isAdminsFetching}
                        className="p-3 text-secondary hover:text-brand hover:bg-soft-bg rounded-2xl border border-soft-border transition"
                        title="تازه‌سازی لیست"
                    >
                        <RefreshCw className={`w-5 h-5 ${isAdminsFetching ? "animate-spin text-brand" : ""}`} />
                    </button>

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition shadow-lg shadow-brand/20"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>تعریف مدیر جدید</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-soft-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">
                            {toPersianDigits(adminsData?.total || 0)}
                        </div>
                        <div className="text-xs font-bold text-secondary mt-0.5">تعداد مدیران فعال</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-soft-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Key className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">
                            {toPersianDigits(availablePermissions.length)}
                        </div>
                        <div className="text-xs font-bold text-secondary mt-0.5">دسترسی‌های سیستمی تعریف‌شده</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-soft-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">
                            {isSuperAdmin ? "مدیر ارشد" : "مدیر سیستم"}
                        </div>
                        <div className="text-xs font-bold text-secondary mt-0.5">نقش کاربری شما</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-soft-border shadow-sm">
                <div className="relative">
                    <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        placeholder="جستجو با شماره موبایل یا نام مدیر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-soft-bg rounded-2xl text-sm border-none focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder:text-secondary/60"
                    />
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-3xl border border-soft-border shadow-sm overflow-hidden">
                {isAdminsLoading ? (
                    <div className="p-16 text-center text-secondary flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-bold">در حال بارگذاری لیست مدیران...</span>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="p-16 text-center text-secondary flex flex-col items-center gap-3">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                        <span className="text-sm font-bold">هیچ مدیری یافت نشد.</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-xs text-primary font-bold hover:underline"
                            >
                                پاک کردن جستجو
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-soft-border">
                        {filteredAdmins.map((admin) => {
                            const isExpanded = expandedAdminId === admin.userId;
                            const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "نامشخص";
                            const permCount = admin.permissions?.length || 0;

                            return (
                                <div key={admin.userId} className="p-6 transition hover:bg-slate-50/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base border border-indigo-100 flex-shrink-0">
                                                {admin.firstName ? admin.firstName[0] : "م"}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-base">{fullName}</span>
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        مدیر سیستم
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        فعال
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-secondary font-medium">
                                                    <div className="flex items-center gap-1.5" dir="ltr">
                                                        <Phone className="w-3.5 h-3.5 text-secondary" />
                                                        <span>{toPersianDigits(admin.phoneNumber)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                                                        <span>
                                                            تاریخ انتصاب:{" "}
                                                            {new Date(admin.assignedAt).toLocaleDateString("fa-IR")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span className="font-bold text-indigo-700">
                                                            {toPersianDigits(permCount)} دسترسی مجاز
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-center">
                                            <button
                                                onClick={() => setExpandedAdminId(isExpanded ? null : admin.userId)}
                                                className="px-3 py-2 text-xs font-bold text-secondary hover:text-slate-800 rounded-xl hover:bg-soft-bg border border-soft-border flex items-center gap-1 transition"
                                            >
                                                <span>مشاهده دسترسی‌ها</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>

                                            <button
                                                onClick={() => handleOpenEditModal(admin)}
                                                className="px-3 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition"
                                            >
                                                <Key className="w-3.5 h-3.5" />
                                                <span>ویرایش دسترسی‌ها</span>
                                            </button>

                                            <button
                                                onClick={() => handleOpenRevokeModal(admin)}
                                                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 flex items-center gap-1.5 transition"
                                            >
                                                <UserX className="w-3.5 h-3.5" />
                                                <span>عزل مدیر</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Permissions Detail */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-soft-border">
                                            <div className="text-xs font-bold text-slate-700 mb-3">
                                                فهرست دسترسی‌های فعال این مدیر:
                                            </div>
                                            {permCount === 0 ? (
                                                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                                                    این مدیر در حال حاضر هیچ دسترسی فعالی ندارد و تمام عملیات مدیریتی برای وی مسدود است.
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {admin.permissions.map((pKey) => {
                                                        const def = availablePermissions.find((p) => p.key === pKey);
                                                        return (
                                                            <span
                                                                key={pKey}
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                                                                title={def?.description || pKey}
                                                            >
                                                                <Check className="w-3 h-3 text-emerald-600" />
                                                                <span>{def?.label || pKey}</span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Admin Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between border-b border-soft-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800">تعریف مدیر جدید در سیستم</h3>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-secondary hover:text-slate-800 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-1 pl-1">
                            {/* Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        شماره موبایل مدیر <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                                        value={createPhone}
                                        onChange={(e) => setCreatePhone(e.target.value)}
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-soft-bg rounded-2xl text-sm border-none focus:ring-2 focus:ring-primary/20 text-slate-800 font-bold"
                                    />
                                    <p className="text-[11px] text-secondary mt-1">
                                        در صورت وجود کاربر در سیستم، دسترسی مدیریت به وی اختصاص داده می‌شود؛ در غیر این صورت حساب جدید ایجاد خواهد شد.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نام</label>
                                        <input
                                            type="text"
                                            placeholder="نام مدیر"
                                            value={createFirstName}
                                            onChange={(e) => setCreateFirstName(e.target.value)}
                                            className="w-full px-4 py-3 bg-soft-bg rounded-2xl text-sm border-none focus:ring-2 focus:ring-primary/20 text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نام خانوادگی</label>
                                        <input
                                            type="text"
                                            placeholder="نام خانوادگی مدیر"
                                            value={createLastName}
                                            onChange={(e) => setCreateLastName(e.target.value)}
                                            className="w-full px-4 py-3 bg-soft-bg rounded-2xl text-sm border-none focus:ring-2 focus:ring-primary/20 text-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Permissions Selector */}
                            <div className="space-y-4 pt-2 border-t border-soft-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800">تعیین دسترسی‌های مجاز</h4>
                                        <p className="text-xs text-secondary mt-0.5">
                                            دسترسی‌های مدنظر را بر اساس بخش‌های کاری انتخاب کنید.
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                                        {toPersianDigits(selectedPermissions.length)} مورد انتخاب شده
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(permissionsByCategory).map(([category, perms]) => {
                                        const allChecked = isCategoryAllSelected(perms);
                                        return (
                                            <div
                                                key={category}
                                                className="border border-soft-border rounded-2xl p-4 bg-slate-50/50 space-y-3"
                                            >
                                                <div className="flex items-center justify-between border-b border-soft-border pb-2.5">
                                                    <span className="text-xs font-black text-slate-800">{category}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCategoryAll(perms)}
                                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                                                    >
                                                        {allChecked ? "لغو انتخاب همه" : "انتخاب همه این بخش"}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {perms.map((p) => {
                                                        const isChecked = selectedPermissions.includes(p.key);
                                                        return (
                                                            <label
                                                                key={p.key}
                                                                className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition border ${
                                                                    isChecked
                                                                        ? "bg-white border-indigo-300 shadow-sm"
                                                                        : "bg-transparent border-transparent hover:bg-white/80"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => togglePermission(p.key)}
                                                                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                                />
                                                                <div className="space-y-0.5">
                                                                    <div className="text-xs font-bold text-slate-800">
                                                                        {p.label}
                                                                    </div>
                                                                    <div className="text-[10px] text-secondary">
                                                                        {p.description}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-soft-border">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-5 py-2.5 text-xs font-bold text-secondary hover:text-slate-800 rounded-xl hover:bg-soft-bg"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() =>
                                    createMutation.mutate({
                                        phoneNumber: createPhone,
                                        firstName: createFirstName || undefined,
                                        lastName: createLastName || undefined,
                                        permissions: selectedPermissions,
                                    })
                                }
                                disabled={createMutation.isPending || !createPhone.trim()}
                                className="px-6 py-2.5 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {createMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>ثبت و اختصاص دسترسی</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Admin Permissions Modal */}
            {isEditModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between border-b border-soft-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">ویرایش دسترسی‌های مدیر</h3>
                                    <p className="text-xs text-secondary">
                                        {[selectedAdmin.firstName, selectedAdmin.lastName].filter(Boolean).join(" ") ||
                                            selectedAdmin.phoneNumber}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-secondary hover:text-slate-800 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">
                                    دسترسی‌های فعال فعلی: {toPersianDigits(selectedPermissions.length)} مورد
                                </span>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                                    const allChecked = isCategoryAllSelected(perms);
                                    return (
                                        <div
                                            key={category}
                                            className="border border-soft-border rounded-2xl p-4 bg-slate-50/50 space-y-3"
                                        >
                                            <div className="flex items-center justify-between border-b border-soft-border pb-2.5">
                                                <span className="text-xs font-black text-slate-800">{category}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategoryAll(perms)}
                                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                                                >
                                                    {allChecked ? "لغو انتخاب همه" : "انتخاب همه این بخش"}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {perms.map((p) => {
                                                    const isChecked = selectedPermissions.includes(p.key);
                                                    return (
                                                        <label
                                                            key={p.key}
                                                            className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition border ${
                                                                isChecked
                                                                    ? "bg-white border-indigo-300 shadow-sm"
                                                                    : "bg-transparent border-transparent hover:bg-white/80"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => togglePermission(p.key)}
                                                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                            />
                                                            <div className="space-y-0.5">
                                                                <div className="text-xs font-bold text-slate-800">
                                                                    {p.label}
                                                                </div>
                                                                <div className="text-[10px] text-secondary">
                                                                    {p.description}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-soft-border">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-5 py-2.5 text-xs font-bold text-secondary hover:text-slate-800 rounded-xl hover:bg-soft-bg"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() =>
                                    updatePermissionsMutation.mutate({
                                        userId: selectedAdmin.userId,
                                        permissions: selectedPermissions,
                                    })
                                }
                                disabled={updatePermissionsMutation.isPending}
                                className="px-6 py-2.5 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {updatePermissionsMutation.isPending && (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                )}
                                <span>ذخیره تغییرات دسترسی</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Admin Confirmation Modal */}
            {isRevokeModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 flex-shrink-0">
                                <UserX className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800">عزل دسترسی مدیر</h3>
                                <p className="text-xs text-secondary mt-0.5">
                                    {[selectedAdmin.firstName, selectedAdmin.lastName].filter(Boolean).join(" ") ||
                                        selectedAdmin.phoneNumber}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            آیا از لغو نقش و دسترسی‌های مدیریت این کاربر اطمینان دارید؟ با این کار، کاربر به یک کاربر عادی تبدیل شده و دسترسی وی به پنل مدیریت فوراً قطع خواهد شد.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                دلیل عزل (اختیاری جهت ثبت در تاریخچه):
                            </label>
                            <input
                                type="text"
                                placeholder="مثال: تغییر مسئولیت، پایان همکاری..."
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                className="w-full px-4 py-3 bg-soft-bg rounded-2xl text-xs border-none focus:ring-2 focus:ring-red-500/20 text-slate-800"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsRevokeModalOpen(false)}
                                className="px-5 py-2.5 text-xs font-bold text-secondary hover:text-slate-800 rounded-xl hover:bg-soft-bg"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() =>
                                    revokeMutation.mutate({
                                        userId: selectedAdmin.userId,
                                        reason: revokeReason || undefined,
                                    })
                                }
                                disabled={revokeMutation.isPending}
                                className="px-5 py-2.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {revokeMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>تایید و عزل دسترسی</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
