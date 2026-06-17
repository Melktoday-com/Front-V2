"use client";

import { CategoryFilter } from "@/components/CategoryFilter";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAds } from "@/hooks/useAds";
import { Search } from "lucide-react";
import { useState } from "react";

export default function AdsScene() {
    const [search, setSearch] = useState("");
    const { data, isLoading } = useAds({
        limit: 12,
        status: "PUBLISHED",
        search: search || undefined
    });

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-8">
                <div className="space-y-4">
                    <h1 className="text-brand text-2xl lg:text-3xl font-black">جستجوی املاک</h1>
                    <div className="relative max-w-2xl">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="نام منطقه، محله یا نوع ملک..."
                            className="w-full bg-soft-bg border border-soft-border rounded-[20px] py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <CategoryFilter />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-soft-bg animate-pulse rounded-[25px]" />
                        ))
                    ) : data?.items?.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="text-secondary-400 font-bold">ملکی با این مشخصات پیدا نشد</div>
                        </div>
                    ) : (
                        (data?.items || []).map((ad) => (
                            <PropertyCard
                                key={ad.adId}
                                title={ad.title}
                                price={Object.values(ad.pricing)[0]?.toLocaleString() || "0"}
                                rating={4.5}
                                location="تهران"
                                image={ad.mediaIds && ad.mediaIds.length > 0
                                    ? `http://localhost:9000/melktoday-media/${ad.mediaIds[0]}`
                                    : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"
                                }
                                category={ad.categoryPath.subcategoryKey}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
