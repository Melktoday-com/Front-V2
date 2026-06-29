"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTemporaryRentAds, usePublishTemporaryRent, useDeleteTemporaryRent } from "@/hooks/useTemporaryRent";
import { ChevronRight, Plus, Rocket, Info, Calendar, Users, MapPin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

const statusLabels: Record<string, { label: string; color: string; border: string }> = {
    DRAFT: { label: "پیش‌نویس", color: "bg-gray-100 text-gray-600", border: "border-gray-200" },
    PENDING_APPROVAL: { label: "در حال بررسی", color: "bg-amber-100 text-amber-600", border: "border-amber-200" },
    PUBLISHED: { label: "منتشر شده", color: "bg-green-100 text-green-600", border: "border-green-200" },
    ARCHIVED: { label: "آرشیو شده", color: "bg-red-100 text-red-600", border: "border-red-200" },
};

export default function TemporaryRentPanelScene() {
    const router = useRouter();
    const { user } = useAuth();
    
    // Fetch user's own rentals using the newly added ownerId filter
    const { data: ads, isLoading, error } = useTemporaryRentAds(
        user?.userId ? { ownerId: user.userId } : {},
        { enabled: !!user?.userId }
    );

    const publishMutation = usePublishTemporaryRent();
    const deleteMutation = useDeleteTemporaryRent();

    const handlePublish = async (id: string) => {
        try {
            await publishMutation.mutateAsync(id);
            toast.success("آگهی با موفقیت منتشر شد");
        } catch (err) {
            toast.error("خطا در انتشار آگهی. لطفا اطلاعات را تکمیل کنید.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("آگهی با موفقیت حذف شد");
        } catch (err) {
            toast.error("خطا در حذف آگهی");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-brand font-black animate-pulse">در حال فراخوانی لیست...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <header className="p-6 lg:px-10 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="hover:bg-soft-bg p-2 rounded-xl transition-colors">
                        <ChevronRight className="w-6 h-6 text-brand" />
                    </button>
                    <h1 className="text-xl lg:text-2xl font-black text-brand">پنل اجاره موقت</h1>
                </div>
                <Button 
                    onClick={() => router.push('/profile/temporary-rent/new')}
                    className="rounded-2xl gap-2 font-black"
                    size="sm"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">ثبت اقامتگاه</span>
                </Button>
            </header>

            <main className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
                {/* Stats or Announcement */}
                <div className="bg-primary/5 border border-primary/10 rounded-[30px] p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                        <Info className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-brand font-black text-lg mb-1">میزبانی هوشمند در ملک تودی</h2>
                        <p className="text-secondary text-sm font-bold leading-relaxed">
                            در این بخش می‌توانید تمامی اقامتگاه‌های خود را مدیریت کنید. برای انتشار نهایی آگهی، اطمینان حاصل کنید که تمامی فیلدها و تصاویر به درستی وارد شده باشند.
                        </p>
                    </div>
                </div>

                {/* Empty State */}
                {ads?.items.length === 0 && (
                    <div className="text-center py-20 bg-soft-bg rounded-[40px] border-2 border-dashed border-soft-border">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Plus className="w-10 h-10 text-brand/20" />
                        </div>
                        <h3 className="text-brand font-black text-xl mb-2">هنوز اقامتگاهی ثبت نکرده‌اید</h3>
                        <p className="text-secondary font-bold mb-8">همین حالا اولین آگهی اجاره موقت خود را بسازید</p>
                        <Button 
                            onClick={() => router.push('/profile/temporary-rent/new')}
                            className="rounded-2xl px-8 h-12 font-black"
                        >
                            ثبت اولین اقامتگاه
                        </Button>
                    </div>
                )}

                {/* List of Ads */}
                <div className="grid gap-6">
                    {ads?.items.map((ad) => (
                        <div 
                            key={ad.id} 
                            className="bg-white rounded-[35px] border border-soft-border overflow-hidden hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 group"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image Section */}
                                <div className="w-full md:w-64 h-48 md:h-auto bg-soft-bg relative overflow-hidden">
                                    {ad.mediaIds && ad.mediaIds.length > 0 ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/media/${ad.mediaIds[0]}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={ad.title}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-secondary/40 gap-2">
                                            <div className="p-3 bg-white rounded-2xl">
                                                <Info className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-black">بدون تصویر</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-xl text-[10px] font-black border shadow-sm",
                                            statusLabels[ad.status]?.color,
                                            statusLabels[ad.status]?.border
                                        )}>
                                            {statusLabels[ad.status]?.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="flex-grow p-6 flex flex-col justify-between h-full">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="text-brand font-black text-lg lg:text-xl leading-tight group-hover:text-primary transition-colors">
                                                {ad.title}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-secondary text-xs font-bold">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-brand/30" />
                                                <span>{ad.cityName || 'شناسه شهر: ' + ad.cityId}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-brand/30" />
                                                <span>تا {ad.maxGuests} نفر</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-brand/30" />
                                                <span>ثبت شده در {new Date(ad.createdAt).toLocaleDateString('fa-IR')}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <div className="text-xs text-secondary font-bold mb-1">اجاره هر شب</div>
                                            <div className="text-primary font-black text-lg">
                                                {formatCurrency(ad.pricing.nightlyPrice)} <span className="text-[10px] mr-1">تومان</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-wrap items-center gap-3">
                                        {ad.status === 'DRAFT' && (
                                            <Button
                                                onClick={() => handlePublish(ad.id)}
                                                disabled={publishMutation.isPending}
                                                className="rounded-2xl gap-2 font-black px-6"
                                            >
                                                <Rocket className="w-4 h-4" />
                                                انتشار آگهی
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/temporary-rent/${ad.id}`)}
                                            className="rounded-2xl border-soft-border text-xs font-black px-6"
                                        >
                                            مشاهده جزئیات
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDelete(ad.id)}
                                            disabled={deleteMutation.isPending}
                                            className="rounded-2xl border-error/20 text-error hover:bg-error/5 text-xs font-black px-4"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
