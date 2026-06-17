"use client";

import { authImage1 } from "@/assets";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { Slider } from "@/components/ui/Slider";
import { AgentAvatar } from "../../components/AgentAvatar";
import { CategoryFilter } from "../../components/CategoryFilter";
import { SearchHeader } from "../../components/SearchHeader";
import { SectionHeader } from "../../components/SectionHeader";

export default function HomeScene() {
    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <div className="p-6 lg:p-10 space-y-12">
                <SearchHeader />
                <CategoryFilter />

                {/* Featured Estates */}
                <section>
                    <SectionHeader title="املاک ویژه" />
                    <Slider spaceBetween={16} className="-mx-6 px-6 lg:mx-0 lg:px-0 pb-4">
                        <PropertyCard
                            variant="horizontal"
                            title="آپارتمان مدرن سعادت آباد"
                            price="25,000"
                            rating={4.8}
                            location="تهران، سعادت آباد"
                            image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80"
                            category="آپارتمان"
                            className="w-70 lg:w-85"
                        />
                        <PropertyCard
                            variant="horizontal"
                            title="ویلای ساحلی شمال"
                            price="45,000"
                            rating={4.9}
                            location="مازندران، نمک آبرود"
                            image="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80"
                            category="ویلا"
                            className="w-70 lg:w-85"
                        />
                        <PropertyCard
                            variant="horizontal"
                            title="پنت‌هاوس مدرن فرمانیه"
                            price="65,000"
                            rating={5.0}
                            location="تهران، فرمانیه"
                            image="https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=400&q=80"
                            category="پنت‌هوس"
                            className="w-70 lg:w-85"
                        />
                    </Slider>
                </section>

                {/* Top Locations */}
                <section>
                    <SectionHeader title="مناطق محبوب" />
                    <Slider spaceBetween={12} className="-mx-6 px-6 lg:mx-0 lg:px-0 pb-2">
                        {["پاسداران", "سعادت آباد", "نیاوران", "فرشته", "زعفرانیه", "ونک", "تجریش"].map((loc) => (
                            <button key={loc} className="px-5 py-3 bg-soft-bg rounded-[15px] text-xs font-bold text-brand whitespace-nowrap border border-soft-border transition-all hover:bg-brand hover:text-white">
                                {loc}
                            </button>
                        ))}
                    </Slider>
                </section>

                {/* Top Agents */}
                <section>
                    <SectionHeader title="مشاورین برتر" />
                    <Slider spaceBetween={24} className="-mx-6 px-6 lg:mx-0 lg:px-0">
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
                <section>
                    <SectionHeader title="گشت و گذار در املاک" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <PropertyCard
                            title="آپارتمان لوکس فرمانیه"
                            price="32,000"
                            rating={4.5}
                            location="تهران، فرمانیه"
                            image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"
                            category="آپارتمان"
                        />
                        <PropertyCard
                            title="پنت هاوس الهیه"
                            price="55,000"
                            rating={5.0}
                            location="تهران، الهیه"
                            image={authImage1.src}
                            category="پنت هاوس"
                        />
                        <PropertyCard
                            title="خانه ویلایی لواسان"
                            price="80,000"
                            rating={4.7}
                            location="تهران، لواسان"
                            image="https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=400&q=80"
                            category="ویلا"
                        />
                        <PropertyCard
                            title="آپارتمان مدرن چیتگر"
                            price="18,000"
                            rating={4.2}
                            location="تهران، دریاچه چیتگر"
                            image="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80"
                            category="آپارتمان"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
