"use client";

import { PropertyCard } from "@/components/ui/PropertyCard";
import { Slider } from "@/components/ui/Slider";
import { useAds } from "@/hooks/useAds";
import { AgentAvatar } from "../../components/AgentAvatar";
import { CategoryFilter } from "../../components/CategoryFilter";
import { SearchHeader } from "../../components/SearchHeader";
import { SectionHeader } from "../../components/SectionHeader";

export default function HomeScene() {
    const { data: featuredData, isLoading: isFeaturedLoading } = useAds({ limit: 6, status: "PUBLISHED" });
    const { data: exploreData, isLoading: isExploreLoading } = useAds({ limit: 8, status: "PUBLISHED" });

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-0 lg:p-10 space-y-12">
                <div className="px-6 lg:px-0 pt-6 lg:pt-0">
                    <SearchHeader />
                </div>
                <div className="pr-6 lg:px-0">
                    <CategoryFilter />
                </div>

                {/* Featured Estates */}
                <section>
                    <div className="px-6 lg:px-0">
                        <SectionHeader title="املاک ویژه" />
                    </div>
                    {isFeaturedLoading ? (
                        <div className="flex gap-4 px-6 lg:px-0 overflow-hidden">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-70 lg:w-85 h-40 bg-soft-bg animate-pulse rounded-[25px]" />
                            ))}
                        </div>
                    ) : (
                        <Slider spaceBetween={16} className="px-6 lg:px-0 pb-4">
                            {featuredData?.items?.map((ad) => (
                                <PropertyCard
                                    key={ad.adId}
                                    variant="horizontal"
                                    title={ad.title}
                                    price={Object.values(ad.pricing)[0]?.toLocaleString() || "0"}
                                    rating={4.5}
                                    location="تهران"
                                    image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80"
                                    category={ad.categoryPath.subcategoryKey}
                                    className="w-70 lg:w-85"
                                />
                            )) || []}
                        </Slider>
                    )}
                </section>

                {/* Top Locations */}
                <section>
                    <div className="px-6 lg:px-0">
                        <SectionHeader title="مناطق محبوب" />
                    </div>
                    <Slider spaceBetween={12} className="px-6 lg:px-0 pb-4">
                        {["سعادت آباد", "پاسداران", "نیاوران", "فرشته", "زعفرانیه", "ونک", "تجریش", "الهیه"].map((loc) => (
                            <button
                                key={loc}
                                className="px-6 py-3.5 bg-soft-bg rounded-[22px] text-sm font-bold text-brand whitespace-nowrap border border-soft-border transition-all hover:bg-brand hover:text-white hover:shadow-lg hover:shadow-brand/20 active:scale-95"
                            >
                                {loc}
                            </button>
                        ))}
                    </Slider>
                </section>

                {/* Top Agents */}
                <section>
                    <div className="px-6 lg:px-0">
                        <SectionHeader title="مشاورین برتر" />
                    </div>
                    <Slider spaceBetween={24} className="px-6 py-10 lg:px-0">
                        <AgentAvatar name="محمد علوی" image="https://i.pravatar.cc/150?u=1" />
                        <AgentAvatar name="سارا کریمی" image="https://i.pravatar.cc/150?u=2" />
                        <AgentAvatar name="امیر حسینی" image="https://i.pravatar.cc/150?u=3" />
                        <AgentAvatar name="رضا احمدی" image="https://i.pravatar.cc/150?u=4" />
                        <AgentAvatar name="نرگس قاسمی" image="https://i.pravatar.cc/150?u=5" />
                        <AgentAvatar name="مریم تهرانی" image="https://i.pravatar.cc/150?u=6" />
                        <AgentAvatar name="علی مرادی" image="https://i.pravatar.cc/150?u=7" />
                        <AgentAvatar name="هدیه صبوری" image="https://i.pravatar.cc/150?u=8" />
                    </Slider>
                </section>

                {/* Explore Estates */}
                <section className="px-6 lg:px-0">
                    <SectionHeader title="گشت و گذار در املاک" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {isExploreLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-soft-bg animate-pulse rounded-[25px]" />
                            ))
                        ) : (
                            exploreData?.items?.map((ad) => (
                                <PropertyCard
                                    key={ad.adId}
                                    title={ad.title}
                                    price={Object.values(ad.pricing)[0]?.toLocaleString() || "0"}
                                    rating={4.5}
                                    location="تهران"
                                    image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"
                                    category={ad.categoryPath.subcategoryKey}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

