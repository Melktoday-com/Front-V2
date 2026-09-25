"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useShowcase,
  useShowcaseListings,
  useShowcasePosts,
  useToggleFollow,
  useToggleLikePost,
} from "@/hooks/useShowcase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  Eye,
  Globe,
  Heart,
  Home,
  Info,
  Mail,
  MapPin,
  Phone,
  Send,
  Share2,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { formatCurrency, toPersianDigits, cn } from "@/lib/utils";
import { toast } from "sonner";
import { UnifiedPost } from "@/types/api/showcase.types";

export default function SinglePlatformScene() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "ads" | "about">("posts");
  const [selectedPost, setSelectedPost] = useState<UnifiedPost | null>(null);

  // Queries
  const { data: showcase, isLoading, error } = useShowcase("platform", "melktoday");
  const { data: postsData, isLoading: isLoadingPosts } = useShowcasePosts("platform", "melktoday");
  const { data: adsData, isLoading: isLoadingAds } = useShowcaseListings("platform", "melktoday");

  // Mutations
  const toggleFollowMutation = useToggleFollow();
  const toggleLikeMutation = useToggleLikePost();

  const header = showcase?.header;
  const about = showcase?.about;

  const handleToggleFollow = () => {
    if (!user) {
      toast.error("برای دنبال کردن ابتدا وارد حساب کاربری خود شوید");
      router.push(`/auth?redirect=/platform`);
      return;
    }
    if (header) {
      toggleFollowMutation.mutate({ targetType: "PLATFORM", targetId: header.id });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "صفحه رسمی پلتفرم ملک تودی",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("لینک صفحه رسمی کپی شد");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-soft-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-secondary">در حال دریافت اطلاعات صفحه رسمی...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-bg pb-24" dir="rtl">
      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full bg-linear-to-l from-brand via-gray-900 to-primary overflow-hidden">
        {header?.coverUrl && (
          <Image src={header.coverUrl} alt="MelkToday Official" fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Top Controls */}
        <div className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-10">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-2xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 rounded-2xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 space-y-6">
        {/* Platform Identity Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right">
              {/* Logo */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-brand border-4 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center p-3">
                {header?.avatarUrl ? (
                  <Image src={header.avatarUrl} alt="Logo" fill className="object-contain p-2" />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tighter">
                    MELK<span className="text-primary">TODAY</span>
                  </span>
                )}
              </div>

              {/* Title & Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-brand">
                    {about?.title || "ملک تودی | MelkToday"}
                  </h1>
                  <span className="flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                    <BadgeCheck className="w-3.5 h-3.5 fill-blue-600 text-white" />
                    صفحه رسمی پلتفرم
                  </span>
                </div>

                <p className="text-xs text-secondary font-medium max-w-xl line-clamp-2">
                  {about?.subtitle || "پلتفرم جامع معاملات و خدمات هوشمند املاک و گردشگری ایران"}
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-secondary font-medium pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-secondary/70" />
                    {toPersianDigits(header?.followersCount || 0)} دنبال‌کننده
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-secondary/70" />
                    {toPersianDigits(header?.postsCount || 0)} پست رسمی
                  </span>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <div className="w-full sm:w-auto">
              <Button
                variant={header?.isFollowing ? "outline" : "primary"}
                onClick={handleToggleFollow}
                disabled={toggleFollowMutation.isPending}
                className={cn(
                  "w-full sm:w-auto h-11 px-8 rounded-2xl font-bold text-xs transition-all",
                  header?.isFollowing && "border-secondary/30 text-secondary hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                )}
              >
                {header?.isFollowing ? "دنبال می‌کنید" : "+ دنبال کردن رسمی"}
              </Button>
            </div>
          </div>

          {/* Official Social Media Bar */}
          {about?.socialMedia && (
            <div className="pt-6 border-t border-soft-border flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <span className="text-xs font-bold text-secondary ml-2">شبکه‌های رسمی:</span>
              {about.socialMedia.instagram && (
                <a
                  href={about.socialMedia.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 transition-colors text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  اینستاگرام
                </a>
              )}
              {about.socialMedia.telegram && (
                <a
                  href={about.socialMedia.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 transition-colors text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  تلگرام
                </a>
              )}
              {about.socialMedia.whatsapp && (
                <a
                  href={about.socialMedia.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors text-xs font-bold flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  واتساپ
                </a>
              )}
              {about.socialMedia.website && (
                <a
                  href={about.socialMedia.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors text-xs font-bold flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  وب‌سایت
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-soft-border gap-6 sm:gap-10 text-sm font-bold bg-white px-6 rounded-2xl border">
          <button
            onClick={() => setActiveTab("posts")}
            className={cn(
              "py-4 relative transition-colors flex items-center gap-2",
              activeTab === "posts" ? "text-primary border-b-2 border-primary -mb-px font-black" : "text-secondary hover:text-brand"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>اخبار و اطلاعیه‌های رسمی ({toPersianDigits(header?.postsCount || 0)})</span>
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={cn(
              "py-4 relative transition-colors flex items-center gap-2",
              activeTab === "ads" ? "text-primary border-b-2 border-primary -mb-px font-black" : "text-secondary hover:text-brand"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>آگهی‌های منتخب پلتفرم</span>
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={cn(
              "py-4 relative transition-colors flex items-center gap-2",
              activeTab === "about" ? "text-primary border-b-2 border-primary -mb-px font-black" : "text-secondary hover:text-brand"
            )}
          >
            <Info className="w-4 h-4" />
            <span>درباره سامانه و پشتیبانی</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {isLoadingPosts ? (
              <div className="text-center py-16 text-secondary text-sm font-bold animate-pulse">
                در حال بارگذاری اطلاعیه‌های رسمی...
              </div>
            ) : postsData?.items?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-soft-border space-y-2">
                <Calendar className="w-10 h-10 text-secondary/30 mx-auto" />
                <p className="text-sm font-bold text-brand">هنوز اطلاعیه‌ای ثبت نشده است</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {postsData?.items?.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white rounded-3xl p-6 border border-soft-border hover:border-primary/30 transition-all cursor-pointer space-y-4 group"
                  >
                    {post.mediaUrls?.[0] && (
                      <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-soft-bg">
                        <Image src={post.mediaUrls[0]} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-secondary">
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg font-bold">
                          {post.category || "اطلاعیه رسمی"}
                        </span>
                        <span>{new Date(post.createdAt).toLocaleDateString("fa-IR")}</span>
                      </div>
                      <h3 className="font-black text-brand text-base group-hover:text-primary transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      {post.summary && (
                        <p className="text-xs text-secondary font-medium leading-relaxed line-clamp-2">
                          {post.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-soft-border text-xs text-secondary">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Eye className="w-3.5 h-3.5" />
                        {toPersianDigits(post.viewCount || 0)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeMutation.mutate(post.id);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 font-bold p-1 rounded-lg transition-colors",
                          post.hasLiked ? "text-rose-500" : "hover:text-rose-500"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", post.hasLiked && "fill-rose-500 text-rose-500")} />
                        {toPersianDigits(post.likeCount || 0)}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "ads" && (
          <div className="space-y-6">
            {isLoadingAds ? (
              <div className="text-center py-16 text-secondary text-sm font-bold animate-pulse">
                در حال بارگذاری آگهی‌ها...
              </div>
            ) : adsData?.items?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-soft-border space-y-2">
                <Home className="w-10 h-10 text-secondary/30 mx-auto" />
                <p className="text-sm font-bold text-brand">هنوز آگهی ویژه‌ای اضافه نشده است</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {adsData?.items?.map((ad) => (
                  <Link
                    key={ad.id}
                    href={`/ads/${ad.id}`}
                    className="bg-white rounded-3xl overflow-hidden border border-soft-border hover:shadow-lg transition-all group flex flex-col"
                  >
                    <div className="relative h-48 w-full bg-soft-bg overflow-hidden">
                      {ad.mediaUrls?.[0] ? (
                        <Image src={ad.mediaUrls[0]} alt={ad.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary/40">
                          <Home className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <h3 className="font-black text-brand text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {ad.title}
                      </h3>
                      <div className="pt-3 border-t border-soft-border flex items-center justify-between text-xs">
                        <span className="text-secondary font-bold">قیمت:</span>
                        <span className="font-black text-brand text-sm">
                          {formatCurrency(ad.totalPrice || ad.price || 0)} تومان
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border space-y-8">
            <div>
              <h3 className="text-base font-black text-brand mb-2">درباره سامانه ملک تودی</h3>
              <p className="text-sm text-secondary font-medium leading-relaxed whitespace-pre-line">
                {about?.description || "توضیحاتی ثبت نشده است."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-soft-border">
              {about?.phone && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-soft-bg border border-soft-border">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-[11px] font-bold text-secondary">شماره تماس پشتیبانی</div>
                    <div className="text-sm font-black text-brand dir-ltr">{about.phone}</div>
                  </div>
                </div>
              )}
              {about?.email && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-soft-bg border border-soft-border">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-[11px] font-bold text-secondary">پست الکترونیکی رسمی</div>
                    <div className="text-sm font-black text-brand dir-ltr">{about.email}</div>
                  </div>
                </div>
              )}
              {about?.address && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-soft-bg border border-soft-border sm:col-span-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-[11px] font-bold text-secondary">نشانی دفتر مرکزی</div>
                    <div className="text-sm font-bold text-brand">{about.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post Reader Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative border border-soft-border shadow-2xl">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-6 left-6 p-2 rounded-full bg-soft-bg hover:bg-soft-border transition-colors"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
            <div className="space-y-2 pr-2">
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {selectedPost.category || "اطلاعیه رسمی"}
              </span>
              <h2 className="text-xl font-black text-brand">{selectedPost.title}</h2>
              <div className="text-xs text-secondary font-medium">
                انتشار: {new Date(selectedPost.createdAt).toLocaleDateString("fa-IR")}
              </div>
            </div>
            {selectedPost.mediaUrls?.[0] && (
              <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-soft-bg">
                <Image src={selectedPost.mediaUrls[0]} alt={selectedPost.title} fill className="object-cover" />
              </div>
            )}
            <div className="text-sm text-brand/90 leading-relaxed font-medium whitespace-pre-line">
              {selectedPost.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
