"use client";

import { useMyAds } from "@/hooks/useAds";
import { adsService } from "@/services/ads.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ChevronRight, Clock, Eye, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "پیش‌نویس", color: "bg-gray-100 text-gray-600" },
    PENDING_APPROVAL: { label: "در حال بررسی", color: "bg-amber-100 text-amber-600" },
    PUBLISHED: { label: "منتشر شده", color: "bg-green-100 text-green-600" },
    ARCHIVED: { label: "آرشیو شده", color: "bg-red-100 text-red-600" },
    REJECTED: { label: "رد شده", color: "bg-red-100 text-red-600" },
};

export default function MyAdsScene() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: ads, isLoading } = useMyAds();

    const submitMutation = useMutation({
        mutationFn: (adId: string) => adsService.submitForReview(adId),
        onSuccess: () => {
            toast.success("آگهی با موفقیت برای بررسی ارسال شد");
            queryClient.invalidateQueries({ queryKey: ["my-ads"] });
        },
        onError: () => {
            toast.error("خطا در ارسال آگهی");
        }
    });

    const archiveMutation = useMutation({
        mutationFn: (adId: string) => adsService.archive(adId),
        onSuccess: () => {
            toast.success("آگهی با موفقیت آرشیو شد");
            queryClient.invalidateQueries({ queryKey: ["my-ads"] });
        },
        onError: () => {
            toast.error("خطا در آرشیو آگهی");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (adId: string) => adsService.delete(adId),
        onSuccess: () => {
            toast.success("آگهی با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["my-ads"] });
        },
        onError: () => {
            toast.error("خطا در حذف آگهی");
        }
    });

    if (isLoading) return <div className="p-10 text-center font-bold">در حال بارگذاری...</div>;

    return (
        <div className="min-h-screen bg-white pb-24">
            <header className="p-6 border-b flex items-center gap-4">
                <button onClick={() => router.back()}>
                    <ChevronRight className="w-6 h-6 text-brand" />
                </button>
                <h1 className="text-xl font-black text-brand">آگهی‌های من</h1>
            </header>

            <div className="p-6 space-y-4">
                {ads?.items.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 font-bold mb-4">شما هنوز آگهی‌ای ثبت نکرده‌اید</p>
                        <button
                            onClick={() => router.push('/ads/submit')}
                            className="bg-primary text-white px-6 py-2 rounded-xl font-bold"
                        >
                            ثبت آگهی جدید
                        </button>
                    </div>
                )}

                {ads?.items.map((ad) => (
                    <div key={ad.adId} className="bg-soft-bg rounded-[25px] border border-soft-border overflow-hidden flex gap-4 p-4">
                        <div className="w-24 h-24 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0">
                            {ad.mediaIds && ad.mediaIds.length > 0 ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`}
                                    className="w-full h-full object-cover"
                                    alt={ad.title}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    بدون تصویر
                                </div>
                            )}
                        </div>

                        <div className="flex-grow flex flex-col justify-between py-1">
                            <div>
                                <h3 className="text-brand font-black text-sm line-clamp-1">{ad.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusLabels[ad.status]?.color}`}>
                                        {statusLabels[ad.status]?.label}
                                    </span>
                                    <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(ad.createdAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {ad.status === 'DRAFT' && (
                                    <button
                                        onClick={() => submitMutation.mutate(ad.adId)}
                                        disabled={submitMutation.isPending}
                                        className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1"
                                    >
                                        <Send className="w-3 h-3" />
                                        ارسال برای تایید
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push(`/ads/submit?edit=${ad.adId}`)}
                                    className="bg-brand/5 text-brand px-3 py-1.5 rounded-xl text-xs font-black"
                                >
                                    ویرایش
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 self-start shrink-0">
                            {ad.status === 'PUBLISHED' && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("آیا از آرشیو کردن این آگهی اطمینان دارید؟")) {
                                            archiveMutation.mutate(ad.adId);
                                        }
                                    }}
                                    disabled={archiveMutation.isPending}
                                    title="آرشیو کردن آگهی"
                                    className="p-2 text-secondary hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => window.open(`/ads/${ad.adId}`, '_blank')}
                                title="مشاهده آگهی"
                                className="p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            {(ad.status === 'DRAFT' || ad.status === 'ARCHIVED' || ad.status === 'REJECTED') && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("آیا از حذف دائمی این آگهی اطمینان دارید؟")) {
                                            deleteMutation.mutate(ad.adId);
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                    title="حذف آگهی"
                                    className="p-2 text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
