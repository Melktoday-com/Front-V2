"use client";

import { usePendingCampaigns } from "@/hooks/useAdmin";
import { adminService } from "@/services/admin.service";
import { CampaignSummary } from "@/types/api/admin.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCampaignsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const { data, isLoading } = usePendingCampaigns({ page, limit: 10 });

    const reviewMutation = useMutation({
        mutationFn: ({ campaignId, action, reason }: { campaignId: string, action: 'APPROVE' | 'REJECT', reason?: string }) =>
            adminService.reviewCampaign(campaignId, action, reason),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'APPROVE' ? "کمپین تایید و فعال شد" : "کمپین رد شد");
            queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "خطا در بررسی کمپین");
        }
    });

    const handleApprove = (campaignId: string) => {
        if (confirm("آیا از تایید این کمپین تبلیغاتی اطمینان دارید؟")) {
            reviewMutation.mutate({ campaignId, action: 'APPROVE' });
        }
    };

    const handleReject = (campaignId: string) => {
        const reason = prompt("علت رد کمپین را وارد کنید:");
        if (reason) {
            reviewMutation.mutate({ campaignId, action: 'REJECT', reason });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">بررسی کمپین‌های تبلیغاتی</h1>
                <p className="text-gray-500">مدیریت بنرها و کمپین‌های ویژه صاحبان کسب‌وکار</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">عنوان کمپین</th>
                            <th className="px-6 py-4 font-semibold">شناسه اسپانسر</th>
                            <th className="px-6 py-4 font-semibold">وضعیت</th>
                            <th className="px-6 py-4 font-semibold">تاریخ ایجاد</th>
                            <th className="px-6 py-4 font-semibold text-center">عملیat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-10 text-center">در حال بارگزاری...</td></tr>
                        ) : !data || data.items.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">هیچ کمپین در انتظار بررسی یافت نشد</td></tr>
                        ) : data.items.map((camp: CampaignSummary) => (
                            <tr key={camp.campaignId} className="hover:bg-gray-50 transition-colors text-sm">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Megaphone size={16} className="text-blue-500" />
                                        <span className="font-medium text-gray-800">{camp.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {camp.sponsorId}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 text-xs">
                                        {camp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(camp.createdAt).toLocaleDateString("fa-IR")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleApprove(camp.campaignId)}
                                            className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 transition-colors"
                                        >
                                            تایید
                                        </button>
                                        <button
                                            onClick={() => handleReject(camp.campaignId)}
                                            className="px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 transition-colors"
                                        >
                                            رد
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
