"use client";

import { usePendingPromotions } from "@/hooks/useAdmin";
import { adminService } from "@/services/admin.service";
import { PromotionSummary } from "@/types/api/admin.types";
import { PromotionStatus } from "@/types/api/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api/error-handler";

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
        onError: (error: Error) => {
            toast.error(normalizeApiError(error, "خطا در انجام عملیات"));
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
                <h1 className="text-2xl font-bold text-foreground">بررسی درخواست‌های ارتقا (Promotions)</h1>
                <p className="text-foreground-muted">مدیریت و تایید آگهی‌های نردبان شده، پین شده و فوری</p>
            </div>

            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-surface-secondary text-foreground-secondary text-sm">
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
                            <tr><td colSpan={6} className="p-10 text-center text-foreground-muted">هیچ درخواست در انتظاری یافت نشد</td></tr>
                        ) : data.items.map((promo: PromotionSummary) => (
                            <tr key={promo.promotionId} className="hover:bg-surface-secondary transition-colors text-sm">
                                <td className="px-6 py-4 font-mono text-foreground-secondary">
                                    <div className="flex items-center gap-2">
                                        <span>{promo.listingId.slice(0, 8)}...</span>
                                        <a href={`/ads/${promo.listingId}`} target="_blank" className="text-info hover:text-info">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100 font-medium">
                                        {promo.promotionType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-foreground-secondary">
                                    {promo.durationDays} روز
                                </td>
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {Number(promo.pricePaidRials).toLocaleString()} ریال
                                </td>
                                <td className="px-6 py-4 text-foreground-muted">
                                    {new Date(promo.requestedAt).toLocaleDateString("fa-IR")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleApprove(promo.promotionId)}
                                            className="p-1.5 text-success hover:bg-success-subtle rounded-md border border-success/30"
                                            title="تایید"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleReject(promo.promotionId)}
                                            className="p-1.5 text-error hover:bg-error-subtle rounded-md border border-error/30"
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
