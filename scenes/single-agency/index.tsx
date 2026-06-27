"use client";

import { PropertyCard } from "@/components/ui/PropertyCard";
import { ErrorState } from "@/components/ui/StatusStates";
import { useAds } from "@/hooks/useAds";
import { useAgency, useFollowAgency, useUnfollowAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { useCreateConversation } from "@/hooks/useChat";
import { ChevronRight, Heart, Mail, MapPin, MessageSquare, Settings2, Verified } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function SingleAgencyScene() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"listings" | "sold" | "reviews">("listings");

    const { isLoggedIn } = useAuth();
    const { data: agency, isLoading: isLoadingAgency, error: agencyError, refetch: refetchAgency } = useAgency(id);
    const { data: adsResponse, isLoading: isLoadingAds } = useAds({
        ownerId: id,
        limit: 20
    });

    const followMutation = useFollowAgency();
    const unfollowMutation = useUnfollowAgency();
    const chatMutation = useCreateConversation();

    const handleFollow = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        if (agency?.isFollowing) {
            unfollowMutation.mutate(id);
        } else {
            followMutation.mutate(id);
        }
    };

    const handleChat = () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }
        chatMutation.mutate({
            subjectType: "AGENCY",
            subjectId: id,
        });
    };

    if (isLoadingAgency) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (agencyError || !agency) return (
        <div className="p-6">
            <ErrorState message="آژانس مورد نظر یافت نشد" onRetry={() => refetchAgency()} />
        </div>
    );

    const ads = adsResponse?.items || [];

    return (
        <div className="flex flex-col min-h-screen pb-24 lg:pb-12 bg-white">
            {/* Header */}
            <header className="px-6 pt-6 flex items-center justify-between mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-soft-bg rounded-full flex items-center justify-center text-brand hover:bg-soft-border transition-colors"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
                <h1 className="text-brand font-black text-lg">پروفایل آژانس</h1>
                <button className="w-12 h-12 bg-soft-bg rounded-full flex items-center justify-center text-brand hover:bg-soft-border transition-colors">
                    <Settings2 className="w-5 h-5" />
                </button>
            </header>

            {/* Profile Info */}
            <section className="flex flex-col items-center px-6 mb-8 text-center">
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 mb-4">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-soft-bg relative">
                        <Image
                            src={agency.logoUrl || "/agency-placeholder.png"}
                            alt={agency.name}
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-brand font-black text-xl lg:text-2xl">{agency.name}</h2>
                    {agency.isVerified && <Verified className="w-5 h-5 text-primary" />}
                </div>

                <div className="flex items-center gap-2 text-secondary text-sm font-bold opacity-70">
                    <Mail className="w-4 h-4" />
                    <span>{agency.phone || "بدون شماره تماس"}</span>
                </div>

                {agency.bio && (
                    <p className="mt-4 text-secondary text-sm font-medium max-w-md line-clamp-3">
                        {agency.bio}
                    </p>
                )}
            </section>

            {/* Actions */}
            <section className="px-6 mb-8 flex gap-3">
                <button
                    onClick={handleFollow}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all ${agency.isFollowing
                        ? "bg-soft-bg text-brand border border-soft-border"
                        : "bg-primary text-white shadow-lg shadow-primary/20"
                        }`}
                >
                    <Heart className={`w-5 h-5 ${agency.isFollowing ? "fill-brand" : ""}`} />
                    {agency.isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
                </button>
                <button
                    onClick={handleChat}
                    disabled={chatMutation.isPending}
                    className="w-12 h-12 bg-white border border-soft-border rounded-2xl flex items-center justify-center text-brand hover:bg-soft-bg transition-colors"
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
            </section>

            {/* Stats */}
            <section className="px-6 mb-8">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-soft-border rounded-3xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-brand font-black text-lg">{ads.length}</span>
                        <span className="text-secondary text-[10px] lg:text-xs font-bold whitespace-nowrap">آگهی‌ها</span>
                    </div>
                    <div className="bg-white border border-soft-border rounded-3xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-brand font-black text-lg">{agency.followerCount}</span>
                        <span className="text-secondary text-[10px] lg:text-xs font-bold whitespace-nowrap">دنبال‌کننده‌ها</span>
                    </div>
                    <div className="bg-white border border-soft-border rounded-3xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-brand font-black text-lg">{agency.rating.toFixed(1)}</span>
                        <span className="text-secondary text-[10px] lg:text-xs font-bold whitespace-nowrap">امتیاز</span>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <section className="px-6 mb-6">
                <div className="bg-soft-bg p-1.5 rounded-[100px] flex gap-2">
                    <button
                        onClick={() => setActiveTab("listings")}
                        className={`flex-1 py-3 rounded-[100px] text-xs lg:text-sm font-black transition-all ${activeTab === "listings" ? "bg-white text-brand shadow-sm" : "text-secondary opacity-60"
                            }`}
                    >
                        آگهی‌های فعال
                    </button>
                    <button
                        onClick={() => setActiveTab("sold")}
                        className={`flex-1 py-3 rounded-[100px] text-xs lg:text-sm font-black transition-all ${activeTab === "sold" ? "bg-white text-brand shadow-sm" : "text-secondary opacity-60"
                            }`}
                    >
                        فروخته شده
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={`flex-1 py-3 rounded-[100px] text-xs lg:text-sm font-black transition-all ${activeTab === "reviews" ? "bg-white text-brand shadow-sm" : "text-secondary opacity-60"
                            }`}
                    >
                        نظرات
                    </button>
                </div>
            </section>

            {/* Content Context */}
            <div className="px-6 flex items-center justify-between mb-4">
                <h3 className="text-brand font-black text-lg">
                    {activeTab === "listings" ? `${ads.length} آگهی پیدا شد` : "موردی یافت نشد"}
                </h3>
            </div>

            {/* Content List */}
            <section className="px-6">
                {isLoadingAds ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[160/250] bg-soft-bg rounded-[25px] animate-pulse" />
                        ))}
                    </div>
                ) : activeTab === "listings" && ads.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {ads.map((ad) => (
                            <PropertyCard
                                key={ad.adId}
                                adId={ad.adId}
                                title={ad.title}
                                price={ad.pricing?.buy?.toLocaleString() || ad.pricing?.rent?.toLocaleString() || "۰"}
                                rating={4.5} // Mock rating if not per-ad
                                location="مشهد" // Mock location if not per-ad in summary
                                image={ad.mediaIds && ad.mediaIds.length > 0
                                    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/media/${ad.mediaIds[0]}`
                                    : "/assets/images/property-placeholder.png"
                                }
                                category={ad.categoryPath.categoryKey}
                                currency="تومان"
                                unit={ad.pricing?.rent ? "/ اجاره" : ""}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                        <MapPin className="w-12 h-12 mb-4 text-secondary" />
                        <p className="text-secondary font-bold">موردی برای نمایش وجود ندارد</p>
                    </div>
                )}
            </section>
        </div>
    );
}
