"use client";

import { useAds } from "@/hooks/useAds";
import { adminService } from "@/services/admin.service";
import { AdSummary } from "@/types/api/ads.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Clock, Eye, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminAdsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");

    const { data, isLoading } = useAds({
        status: statusFilter,
        limit: 20
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, note }: { id: string, note?: string }) =>
            adminService.approveListing(id, { note }),
        onSuccess: () => {
            toast.success("آگهی با موفقیت تایید شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "خطا در تایید آگهی";
            toast.error(message);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason, note }: { id: string, reason: string, note?: string }) =>
            adminService.rejectListing(id, { reason, note }),
        onSuccess: () => {
            toast.success("آگهی رد شد");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "خطا در عملیات";
            toast.error(message);
        }
    });

    const handleApprove = (id: string) => {
        if (confirm("آیا از تایید این آگهی اطمینان دارید؟")) {
            approveMutation.mutate({ id });
        }
    };

    const handleReject = (id: string) => {
        const reason = prompt("علت رد آگهی را وارد کنید:");
        if (reason) {
            rejectMutation.mutate({ id, reason });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت آگهی‌ها</h1>
                    <p className="text-gray-500">مشاهده و بررسی آگهی‌های ثبت شده در سیستم</p>
                </div>

                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setStatusFilter("PENDING_APPROVAL")}
                        className={`px-4 py-2 text-sm rounded-md transition-all ${statusFilter === "PENDING_APPROVAL" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        در انتظار تایید
                    </button>
                    <button
                        onClick={() => setStatusFilter("PUBLISHED")}
                        className={`px-4 py-2 text-sm rounded-md transition-all ${statusFilter === "PUBLISHED" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        منتشر شده
                    </button>
                    <button
                        onClick={() => setStatusFilter("ARCHIVED")}
                        className={`px-4 py-2 text-sm rounded-md transition-all ${statusFilter === "ARCHIVED" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        آرشیو شده
                    </button>
                    <button
                        onClick={() => setStatusFilter("REJECTED")}
                        className={`px-4 py-2 text-sm rounded-md transition-all ${statusFilter === "REJECTED" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        رد شده
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">عنوان آگهی</th>
                            <th className="px-6 py-4 font-semibold">دسته‌بندی</th>
                            <th className="px-6 py-4 font-semibold">تاریخ ثبت</th>
                            <th className="px-6 py-4 font-semibold">وضعیت</th>
                            <th className="px-6 py-4 font-semibold text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">در حال بارگزاری...</td></tr>
                        ) : !data || data.items.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">هیچ آگهی یافت نشد</td></tr>
                        ) : data.items.map((ad: AdSummary) => (
                            <tr key={ad.adId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {/* Media preview would go here */}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{ad.title}</p>
                                            <p className="text-xs text-gray-500">شناسه: {ad.adId.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {ad.categoryPath.categoryKey} / {ad.categoryPath.subcategoryKey}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        {ad.status === "PENDING_APPROVAL" && <Clock size={14} className="text-amber-500" />}
                                        {ad.status === "PUBLISHED" && <Check size={14} className="text-green-500" />}
                                        {ad.status === "REJECTED" && <AlertCircle size={14} className="text-red-500" />}
                                        <span className="text-xs font-medium">
                                            {ad.status === "PENDING_APPROVAL" ? "در انتظار" : ad.status === "PUBLISHED" ? "منتشر شده" :
                                                ad.status === "REJECTED" ? "رد شده" : ad.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            title="مشاهده جزئیات"
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {ad.status === "PENDING_APPROVAL" && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(ad.adId)}
                                                    title="تایید"
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(ad.adId)}
                                                    title="رد"
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

