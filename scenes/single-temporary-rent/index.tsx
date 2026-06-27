"use client";

import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { ReviewsSection } from "@/components/ui/ReviewsSection";
import { ErrorState } from "@/components/ui/StatusStates";
import { useTemporaryRentAdDetail, useTemporaryRentAds } from "@/hooks/useTemporaryRent";
import { cn } from "@/lib/utils";
import {
    Bath,
    Bed,
    ChevronRight,
    Heart,
    MapPin,
    MessageCircle,
    Share2,
    Star,
    Users,
    Wifi
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ResidenceDetailScene() {
    const params = useParams();
    const id = params.id as string;
    const { data: residence, isLoading, error, refetch } = useTemporaryRentAdDetail(id);

    const { data: similarResidences } = useTemporaryRentAds({
        limit: 6,
        cityId: residence?.cityId,
        status: "PUBLISHED"
    }, { enabled: !!residence?.cityId });

    const [isFavorite, setIsFavorite] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col animate-pulse p-6 space-y-8">
                <div className="w-full aspect-[16/9] bg-soft-bg rounded-[40px]" />
                <div className="h-10 bg-soft-bg rounded-xl w-1/2" />
                <div className="h-6 bg-soft-bg rounded-xl w-1/4" />
            </div>
        );
    }

    if (error || !residence) {
        return (
            <div className="p-6">
                <ErrorState message="خطا در بارگذاری اطلاعات اقامتگاه" onRetry={() => refetch()} />
            </div>
        );
    }

    const mainImage = residence.mediaIds?.[0]
        ? `${process.env.NEXT_PUBLIC_API_URL}/media/${residence.mediaIds[0]}`
        : "/assets/images/property-placeholder.png";

    const galleryImages = residence.mediaIds?.slice(1).map((mid: string) =>
        `${process.env.NEXT_PUBLIC_API_URL}/media/${mid}`
    ) || [];

    const reviews = [
        /* ... existing reviews or handle them if they come from API ... */
    ];

    const nearbyAds = [
        /* ... handle nearby ads if available ... */
    ];

    return (
        <div className="flex flex-col pb-24 lg:pb-8">
            {/* Property Overview header */}
            <section className="relative w-full aspect-[375/524] lg:aspect-[16/7] px-6 pt-6">
                <div className="relative w-full h-full overflow-hidden rounded-[40px] lg:rounded-[50px] shadow-xl">
                    <Image
                        src={mainImage}
                        alt={residence.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

                    {/* Top Bar */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                        <button
                            onClick={() => window.history.back()}
                            className="w-[50px] h-[50px] bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-brand transition-all hover:bg-white"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="flex gap-4">
                            <button className="w-[50px] h-[50px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:bg-white/40">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsFavorite(!isFavorite)}
                                className={cn(
                                    "w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all shadow-lg",
                                    isFavorite ? "bg-primary text-white" : "bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                            </button>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 bg-brand/70 backdrop-blur-md text-white px-5 py-3 rounded-[25px]">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-bold">۴.۹</span>
                            </div>
                            <div className="bg-brand/70 backdrop-blur-md text-white px-5 py-3 rounded-[25px]">
                                <span className="text-sm font-bold">اجاره روزانه</span>
                            </div>
                        </div>

                        {/* Gallery Preview */}
                        {galleryImages.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {galleryImages.slice(0, 2).map((img: string, i: number) => (
                                    <div key={i} className="relative w-[60px] h-[60px] border-2 border-white rounded-[18px] overflow-hidden">
                                        <Image src={img} alt="Gallery" fill className="object-cover" />
                                    </div>
                                ))}
                                {galleryImages.length > 2 && (
                                    <div className="relative w-[60px] h-[60px] border-2 border-white rounded-[18px] overflow-hidden bg-brand/40 backdrop-blur-sm flex items-center justify-center">
                                        <Image src={galleryImages[2]} alt="Gallery" fill className="object-cover opacity-60" />
                                        <span className="relative z-10 text-white font-bold text-lg">+{galleryImages.length - 2}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Info */}
            <section className="px-6 mt-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-brand font-black text-2xl lg:text-3xl">{residence.title}</h1>
                        <div className="flex items-center gap-1 mt-2 text-secondary">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{residence.cityName || "مشهد"}</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="text-brand font-black text-2xl lg:text-3xl line-clamp-1">{residence.pricing.nightlyPrice.toLocaleString()} تومان</div>
                        <div className="text-secondary text-xs mt-1">هر شب</div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-8">
                    <h2 className="text-brand font-black text-xl mb-4">توضیحات</h2>
                    <p className="text-secondary text-sm leading-relaxed whitespace-pre-line">
                        {residence.description || "توضیحاتی برای این اقامتگاه ثبت نشده است."}
                    </p>
                </div>
            </section>

            {/* Owner Info */}
            <section className="px-6 mt-8">
                <div className="bg-soft-bg p-4 rounded-[25px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-white">
                            <Image
                                src={residence.owner?.avatarUrl || "https://www.figma.com/api/mcp/asset/376e2731-44dd-49d5-a571-bc96b8031d99"}
                                alt="Agent"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="text-brand font-bold text-sm">{residence.owner?.fullName || "میزبان مَلک‌تودی"}</h3>
                            <p className="text-secondary text-[10px]">میزبان</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand/90 transition-all">
                            <MessageCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Facilities */}
            <section className="px-6 mt-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3">
                    {[
                        { icon: Users, label: `${residence.guestCapacity || 0} نفر ظرفیت` },
                        { icon: Bed, label: `${residence.attributes?.rooms || 0} اتاق خواب` },
                        { icon: Bath, label: `${residence.attributes?.bathrooms || 0} سرویس` },
                        { icon: Wifi, label: "اینترنت رایگان" }
                    ].map((item, i) => (
                        <div key={i} className="shrink-0 flex items-center gap-2 bg-soft-bg px-6 py-4 rounded-full">
                            <item.icon className="w-5 h-5 text-secondary" />
                            <span className="text-xs font-medium text-secondary whitespace-nowrap">{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Location & Public Facilities */}
            <section className="px-6 mt-10">
                <h2 className="text-brand font-black text-xl mb-4">موقعیت و امکانات رفاهی</h2>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-[50px] h-[50px] bg-soft-bg rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-secondary text-xs leading-relaxed">{residence.address || "آدرسی ثبت نشده است"}</p>
                </div>

                {/* Map Preview */}
                <div className="relative w-full aspect-[16/7] lg:aspect-[16/5] rounded-[25px] overflow-hidden group">
                    <Image
                        src="https://www.figma.com/api/mcp/asset/eac6179f-e99c-4942-a213-b27f60186f8d"
                        alt="Map View"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-[50px] bg-white/50 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/70 transition-all">
                        <span className="text-brand text-xs font-bold">مشاهده روی نقشه</span>
                    </div>
                    {/* Custom Markers Placeholder */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews */}
            <ReviewsSection targetId={id} targetType="temporary-rent" />

            {/* Similar Properties */}
            {similarResidences?.items && similarResidences.items.length > 0 && (
                <section className="mt-10 mb-10">
                    <div className="px-6 flex justify-between items-center mb-6">
                        <h2 className="text-brand font-black text-xl">موارد مشابه</h2>
                        <Button variant="link" size="sm" className="text-secondary text-xs">مشاهده همه</Button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar">
                        {similarResidences.items.filter(item => item.id !== id).map((item) => (
                            <div key={item.id} className="w-[180px] flex-shrink-0">
                                <PropertyCard
                                    adId={item.id}
                                    title={item.title}
                                    price={item.pricing.nightlyPrice.toLocaleString()}
                                    rating={4.9}
                                    location={residence.cityName || "مشهد"}
                                    image={item.mediaIds?.[0]
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/media/${item.mediaIds[0]}`
                                        : "/assets/images/property-placeholder.png"
                                    }
                                    category="اجاره روزانه"
                                    unit="/شب"
                                    currency=""
                                    href={`/temporary-rent/${item.id}`}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
