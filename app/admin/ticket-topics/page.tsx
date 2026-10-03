"use client";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
    useActivateTicketTopic,
    useAllTicketTopics,
    useCreateTicketTopic,
    useDeactivateTicketTopic,
    useDeleteTicketTopic,
    useUpdateTicketTopic,
} from "@/hooks/useTicketing";
import { normalizeApiError } from "@/lib/api/error-handler";
import { cn, toPersianDigits } from "@/lib/utils";
import { TicketTopic } from "@/types/api/ticketing.types";
import { formatDistanceToNow } from "date-fns-jalali";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Edit2,
    Loader2,
    Plus,
    Power,
    PowerOff,
    RefreshCw,
    Search,
    ShieldAlert,
    Tag,
    Trash2,
    X,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function AdminTicketTopicsPage() {
    const { isSuperAdmin, isLoading: permissionsLoading } = useAdminPermissions();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<TicketTopic | null>(null);
    const [deletingTopic, setDeletingTopic] = useState<TicketTopic | null>(null);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

    // Form states
    const [createKey, setCreateKey] = useState("");
    const [createLabel, setCreateLabel] = useState("");
    const [createSortOrder, setCreateSortOrder] = useState<number>(0);

    const [editLabel, setEditLabel] = useState("");
    const [editSortOrder, setEditSortOrder] = useState<number>(0);

    // Queries & Mutations
    const {
        data: topics,
        isLoading: isTopicsLoading,
        isFetching: isTopicsFetching,
        refetch: refetchTopics,
    } = useAllTicketTopics(isSuperAdmin);

    const createMutation = useCreateTicketTopic();
    const updateMutation = useUpdateTicketTopic();
    const activateMutation = useActivateTicketTopic();
    const deactivateMutation = useDeactivateTicketTopic();
    const deleteMutation = useDeleteTicketTopic();

    if (permissionsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-bold text-secondary">
                    در حال بررسی دسترسی‌ها...
                </span>
            </div>
        );
    }

    if (!isSuperAdmin) {
        return (
            <div className="p-8" dir="rtl">
                <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-black text-brand mb-2">
                        دسترسی مخصوص راهبر ارشد (SuperAdmin)
                    </h3>
                    <p className="text-xs text-secondary leading-relaxed">
                        مدیریت کاتالوگ موضوعات تیکت فقط در حیطه اختیارات سوپرادمین سیستم است.
                    </p>
                </div>
            </div>
        );
    }

    const filteredTopics = (topics || []).filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return t.label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q);
    });

    const handleOpenCreateModal = () => {
        setCreateKey("");
        setCreateLabel("");
        setCreateSortOrder(0);
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedKey = createKey.trim();
        const trimmedLabel = createLabel.trim();

        if (!trimmedKey || !trimmedLabel) {
            toast.error("لطفاً شناسه یکتا و عنوان موضوع را وارد نمایید.");
            return;
        }

        try {
            await createMutation.mutateAsync({
                key: trimmedKey,
                label: trimmedLabel,
                sortOrder: Number(createSortOrder) || 0,
            });
            toast.success("موضوع تیکت با موفقیت ایجاد شد");
            setIsCreateModalOpen(false);
            refetchTopics();
        } catch (err) {
            const errorMsg = normalizeApiError(
                err instanceof Error ? err : String(err),
                "خطا در ایجاد موضوع تیکت"
            );
            toast.error(errorMsg);
        }
    };

    const handleOpenEditModal = (topic: TicketTopic) => {
        setEditingTopic(topic);
        setEditLabel(topic.label);
        setEditSortOrder(topic.sortOrder);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTopic) return;

        const trimmedLabel = editLabel.trim();
        if (!trimmedLabel) {
            toast.error("عنوان موضوع نمی‌تواند خالی باشد.");
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: editingTopic.id,
                payload: {
                    label: trimmedLabel,
                    sortOrder: Number(editSortOrder) || 0,
                },
            });
            toast.success("موضوع تیکت با موفقیت ویرایش شد");
            setEditingTopic(null);
            refetchTopics();
        } catch (err) {
            const errorMsg = normalizeApiError(
                err instanceof Error ? err : String(err),
                "خطا در ویرایش موضوع تیکت"
            );
            toast.error(errorMsg);
        }
    };

    const handleToggleActive = async (topic: TicketTopic) => {
        try {
            if (topic.isActive) {
                await deactivateMutation.mutateAsync(topic.id);
                toast.success(`موضوع «${topic.label}» غیرفعال شد`);
            } else {
                await activateMutation.mutateAsync(topic.id);
                toast.success(`موضوع «${topic.label}» فعال شد`);
            }
            refetchTopics();
        } catch (err) {
            const errorMsg = normalizeApiError(
                err instanceof Error ? err : String(err),
                "خطا در تغییر وضعیت موضوع"
            );
            toast.error(errorMsg);
        }
    };

    const handleDeleteTopic = async () => {
        if (!deletingTopic) return;
        setDeleteErrorMessage(null);

        try {
            await deleteMutation.mutateAsync(deletingTopic.id);
            toast.success(`موضوع «${deletingTopic.label}» با موفقیت حذف شد`);
            setDeletingTopic(null);
            refetchTopics();
        } catch (err) {
            const errorMsg = normalizeApiError(
                err instanceof Error ? err : String(err),
                "امکان حذف فیزیکی این موضوع به دلیل وجود تیکت‌های تاریخی وجود ندارد. می‌توانید آن را غیرفعال کنید."
            );
            setDeleteErrorMessage(errorMsg);
            toast.error(errorMsg);
        }
    };

    const formatTimestamp = (dateStr: string) => {
        try {
            const formatted = formatDistanceToNow(new Date(dateStr), { addSuffix: true });
            return toPersianDigits(formatted);
        } catch {
            return "چند لحظه پیش";
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-soft-border shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Tag className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-brand">
                            مدیریت موضوعات تیکت (Ticket Topics)
                        </h1>
                        <p className="text-xs text-secondary mt-0.5">
                            تعریف دسته‌بندی‌های پشتیبانی، اولویت‌بندی و فعال‌سازی برای انتخاب کاربران
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => refetchTopics()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-soft-border hover:bg-soft-bg text-secondary font-bold text-xs transition-colors"
                    >
                        <RefreshCw
                            className={cn(
                                "w-4 h-4",
                                isTopicsFetching && "animate-spin text-primary"
                            )}
                        />
                        <span>بروزرسانی</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand text-white font-black text-xs shadow-md hover:bg-brand/90 transition-all"
                    >
                        <Plus className="w-4 h-4 text-primary" />
                        <span>موضوع جدید</span>
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-soft-border flex items-center gap-3 shadow-xs">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در کلید یا عنوان موضوع..."
                        className="w-full pl-3 pr-10 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary bg-soft-bg/20 font-bold"
                    />
                </div>
                <span className="text-xs text-secondary font-bold whitespace-nowrap">
                    تعداد کل: {toPersianDigits(topics?.length || 0)}
                </span>
            </div>

            {/* Topics Table Card */}
            <div className="bg-white rounded-3xl border border-soft-border overflow-hidden shadow-xs">
                {isTopicsLoading ? (
                    <div className="flex items-center justify-center py-24 gap-3 text-secondary font-bold text-xs">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>در حال بارگذاری موضوعات تیکت...</span>
                    </div>
                ) : filteredTopics.length === 0 ? (
                    <div className="py-20 text-center">
                        <Tag className="w-10 h-10 text-secondary/30 mx-auto mb-2" />
                        <p className="text-xs font-bold text-secondary">
                            موضوعی برای نمایش یافت نشد.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-soft-bg/60 border-b border-soft-border text-secondary font-black">
                                <tr>
                                    <th className="py-3.5 px-4">عنوان موضوع</th>
                                    <th className="py-3.5 px-4">شناسه یکتا (Key)</th>
                                    <th className="py-3.5 px-4 text-center">ترتیب نمایش</th>
                                    <th className="py-3.5 px-4 text-center">وضعیت</th>
                                    <th className="py-3.5 px-4">تاریخ ایجاد</th>
                                    <th className="py-3.5 px-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-soft-border/60 font-bold">
                                {filteredTopics.map((topic) => (
                                    <tr
                                        key={topic.id}
                                        className="hover:bg-soft-bg/30 transition-colors"
                                    >
                                        <td className="py-4 px-4 font-black text-brand">
                                            {topic.label}
                                        </td>
                                        <td className="py-4 px-4 font-mono text-secondary">
                                            <code>{topic.key}</code>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {toPersianDigits(topic.sortOrder)}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {topic.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    فعال
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-600 border border-gray-200">
                                                    <PowerOff className="w-3 h-3" />
                                                    غیرفعال
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-secondary text-[11px]">
                                            {formatTimestamp(topic.createdAt)}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(topic)}
                                                    className="p-1.5 rounded-xl border border-soft-border hover:bg-soft-bg text-secondary hover:text-brand transition-colors"
                                                    title="ویرایش عنوان و ترتیب"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(topic)}
                                                    className={cn(
                                                        "p-1.5 rounded-xl border transition-colors",
                                                        topic.isActive
                                                            ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                    )}
                                                    title={
                                                        topic.isActive
                                                            ? "غیرفعال‌سازی موضوع"
                                                            : "فعال‌سازی موضوع"
                                                    }
                                                >
                                                    {topic.isActive ? (
                                                        <PowerOff className="w-4 h-4" />
                                                    ) : (
                                                        <Power className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletingTopic(topic);
                                                        setDeleteErrorMessage(null);
                                                    }}
                                                    className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                                    title="حذف موضوع"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Topic Modal */}
            {isCreateModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                >
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-soft-border space-y-4">
                        <div className="flex items-center justify-between border-b border-soft-border pb-3">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" />
                                <span>ایجاد موضوع تیکت جدید</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1.5 rounded-xl text-secondary hover:bg-soft-bg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-black text-brand mb-1">
                                    شناسه یکتا (Key / Slug)
                                </label>
                                <input
                                    type="text"
                                    value={createKey}
                                    onChange={(e) => setCreateKey(e.target.value)}
                                    placeholder="مثال: technical-support یا billing"
                                    required
                                    className="w-full px-3.5 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary font-mono"
                                    dir="ltr"
                                />
                                <span className="text-[10px] text-secondary mt-1 block">
                                    تنها حروف انگلیسی کوچک، خط تیره و زیرخط مجاز است.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-brand mb-1">
                                    عنوان نمایشی به فارسی (Label)
                                </label>
                                <input
                                    type="text"
                                    value={createLabel}
                                    onChange={(e) => setCreateLabel(e.target.value)}
                                    placeholder="مثال: مشکلات فنی و حساب کاربری"
                                    required
                                    className="w-full px-3.5 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-brand mb-1">
                                    ترتیب نمایش (Sort Order)
                                </label>
                                <input
                                    type="number"
                                    value={createSortOrder}
                                    onChange={(e) => setCreateSortOrder(Number(e.target.value))}
                                    className="w-full px-3.5 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary font-bold"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft-border">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-2xl border border-soft-border text-xs font-bold text-secondary hover:bg-soft-bg"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="px-4 py-2 rounded-2xl bg-brand text-white text-xs font-black hover:bg-brand/90 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    ) : (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                    <span>ثبت موضوع</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Topic Modal */}
            {editingTopic && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                >
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-soft-border space-y-4">
                        <div className="flex items-center justify-between border-b border-soft-border pb-3">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-primary" />
                                <span>ویرایش موضوع تیکت</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingTopic(null)}
                                className="p-1.5 rounded-xl text-secondary hover:bg-soft-bg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-black text-brand mb-1">
                                    شناسه یکتا (غیرقابل تغییر)
                                </label>
                                <input
                                    type="text"
                                    value={editingTopic.key}
                                    disabled
                                    className="w-full px-3.5 py-2 rounded-2xl border border-soft-border text-xs bg-gray-100 font-mono text-secondary cursor-not-allowed"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-brand mb-1">
                                    عنوان نمایشی (Label)
                                </label>
                                <input
                                    type="text"
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-brand mb-1">
                                    ترتیب نمایش (Sort Order)
                                </label>
                                <input
                                    type="number"
                                    value={editSortOrder}
                                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                                    className="w-full px-3.5 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary font-bold"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft-border">
                                <button
                                    type="button"
                                    onClick={() => setEditingTopic(null)}
                                    className="px-4 py-2 rounded-2xl border border-soft-border text-xs font-bold text-secondary hover:bg-soft-bg"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="px-4 py-2 rounded-2xl bg-brand text-white text-xs font-black hover:bg-brand/90 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    {updateMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    ) : (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                    <span>ذخیره تغییرات</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Topic Safeguard Modal */}
            {deletingTopic && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                >
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-soft-border space-y-4">
                        <div className="flex items-center justify-between border-b border-soft-border pb-3">
                            <h3 className="text-sm font-black text-brand flex items-center gap-2 text-red-600">
                                <Trash2 className="w-4 h-4" />
                                <span>حذف موضوع تیکت</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingTopic(null);
                                    setDeleteErrorMessage(null);
                                }}
                                className="p-1.5 rounded-xl text-secondary hover:bg-soft-bg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-brand leading-relaxed font-bold">
                            آیا از حذف موضوع «{deletingTopic.label}» اطمینان دارید؟
                        </p>

                        {deleteErrorMessage && (
                            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <span className="font-bold leading-relaxed">
                                        {deleteErrorMessage}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await handleToggleActive(deletingTopic);
                                        setDeletingTopic(null);
                                        setDeleteErrorMessage(null);
                                    }}
                                    className="w-full py-2 px-3 bg-white border border-red-300 rounded-xl text-xs font-black text-red-700 hover:bg-red-50/50 transition-colors"
                                >
                                    غیرفعال‌سازی این موضوع به جای حذف
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft-border">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingTopic(null);
                                    setDeleteErrorMessage(null);
                                }}
                                className="px-4 py-2 rounded-2xl border border-soft-border text-xs font-bold text-secondary hover:bg-soft-bg"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteTopic}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 rounded-2xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>تایید و حذف</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
