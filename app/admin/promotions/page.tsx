"use client";

import { usePendingPromotions } from "@/hooks/useAdmin";
import { adminService } from "@/services/admin.service";
import { PromotionSummary } from "@/types/api/admin.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPromotionsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const { data, isLoading } = usePendingPromotions({ page, limit: 10 });

    const reviewMutation = useMutation({
        mutationFn: ({ promotionId, action, reason }: { promotionId: string, action: 'APPROVE' | 'REJECT', reason?: string }) =>
            adminService.reviewPromotion(promotionId, action, reason),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'APPROVE' ? "ارتقا آگهی تایید شد" : "درخواست رد شد");
            queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "خطا در انجام عملیات");
        }
    });

    const handleApprove = (promotionId: string) => {
        if (confirm("آیا از تایید این ارتقا آگهی اطمینان دارید؟")) {
            reviewMutation.mutate({ promotionId, action: 'APPROVE' });
        }
    };

    const handleReject = (promotionId: string) => {
        const reason = prompt("علت رد درخواست را وارد کنید:");
        if (reason) {
            reviewMutation.mutate({ promotionId, action: 'REJECT', reason });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">بررسی درخواست‌های ارتقا (Promotions)</h1>
                <p className="text-gray-500">مدیریت و تایید آگهی‌های نردبان شده، پین شده و فوری</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">شناسه آگهی</th>
                            <th className="px-6 py-4 font-semibold">نوع ارتقا</th>
                            <th className="px-6 py-4 font-semibold">مدت (روز)</th>
                            <th className="px-6 py-4 font-semibold">مبلغ پرداخت شده</th>
                            <th className="px-6 py-4 font-semibold">تاریخ درخواست</th>
                            <th className="px-6 py-4 font-semibold text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-10 text-center">در حال بارگزاری...</td></tr>
                        ) : !data || data.items.length === 0 ? (
                            <tr><td colSpan={6} className="p-10 text-center text-gray-400">هیچ درخواستPending یافت نشد</td></tr>
                        ) : data.items.map((promo: PromotionSummary) => (
                            <tr key={promo.promotionId} className="hover:bg-gray-50 transition-colors text-sm">
                                <td className="px-6 py-4 font-mono text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span>{promo.listingId.slice(0, 8)}...</span>
                                        <a href={`/ads/${promo.listingId}`} target="_blank" className="text-blue-500 hover:text-blue-700">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100 font-medium">
                                        {promo.promotionType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    {promo.durationDays} روز
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {Number(promo.pricePaidRials).toLocaleString()} ریال
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(promo.requestedAt).toLocaleDateString("fa-IR")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleApprove(promo.promotionId)}
                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md border border-green-100"
                                            title="تایید"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleReject(promo.promotionId)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md border border-red-100"
                                            title="رد درخواست"
                                        >
                                            <X size={18} />
                                        </button>
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
