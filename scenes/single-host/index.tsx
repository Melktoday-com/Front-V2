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
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Home,
  Info,
  MapPin,
  MessageSquare,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react";
import { formatCurrency, toPersianDigits, cn } from "@/lib/utils";
import { toast } from "sonner";
import { UnifiedPost } from "@/types/api/showcase.types";

interface SingleHostSceneProps {
  idOrSlug: string;
}

export default function SingleHostScene({ idOrSlug }: SingleHostSceneProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"rentals" | "posts" | "about">("rentals");
  const [selectedPost, setSelectedPost] = useState<UnifiedPost | null>(null);

  // Queries
  const { data: showcase, isLoading, error } = useShowcase("host", idOrSlug);
  const { data: rentalsData, isLoading: isLoadingRentals } = useShowcaseListings("host", idOrSlug);
  const { data: postsData, isLoading: isLoadingPosts } = useShowcasePosts("host", idOrSlug);

  // Mutations
  const toggleFollowMutation = useToggleFollow();
  const toggleLikeMutation = useToggleLikePost();

  const header = showcase?.header;
  const about = showcase?.about;

  const handleToggleFollow = () => {
    if (!user) {
      toast.error("برای دنبال کردن ابتدا وارد حساب کاربری خود شوید");
      router.push(`/auth?redirect=/host/${idOrSlug}`);
      return;
    }
    if (header) {
      toggleFollowMutation.mutate({ targetType: "HOST", targetId: header.id });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: header?.title || "میزبان اقامتگاه",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("لینک صفحه کپی شد");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-soft-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-secondary">در حال دریافت اطلاعات اقامتگاه...</p>
        </div>
      </div>
    );
  }

  if (error || !header) {
    return (
      <div className="min-h-screen bg-soft-bg flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full border border-soft-border space-y-4 shadow-sm">
          <Home className="w-12 h-12 text-secondary/40 mx-auto" />
          <h2 className="text-lg font-black text-brand">صفحه میزبان یافت نشد</h2>
          <p className="text-xs text-secondary">ممکن است نشانی را اشتباه وارد کرده باشید یا این صفحه غیرفعال شده باشد.</p>
          <Button onClick={() => router.push("/")} className="w-full rounded-2xl">
            بازگشت به صفحه اصلی
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-bg pb-24" dir="rtl">
      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full bg-linear-to-l from-emerald-800 to-teal-900 overflow-hidden">
        {header.coverUrl ? (
          <Image src={header.coverUrl} alt={header.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-cover-pattern opacity-10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Floating Controls */}
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
        {/* Host Identity Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right">
              {/* Avatar */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-soft-bg border-4 border-white shadow-md overflow-hidden shrink-0">
                {header.avatarUrl ? (
                  <Image src={header.avatarUrl} alt={header.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-600 font-black text-2xl">
                    {header.title.charAt(0)}
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-brand">{header.title}</h1>
                  {header.isVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      میزبان تاییدشده
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-secondary font-medium flex-wrap">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {toPersianDigits(header.rating?.toFixed(1) || "5.0")}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-secondary/70" />
                    {toPersianDigits(header.followersCount || 0)} دنبال‌کننده
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-secondary/70" />
                    {toPersianDigits(header.listingsCount || 0)} اقامتگاه فعال
                  </span>
                </div>
              </div>
            </div>

            {/* Actions (Follow & Contact) */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant={header.isFollowing ? "outline" : "primary"}
                onClick={handleToggleFollow}
                disabled={toggleFollowMutation.isPending}
                className={cn(
                  "flex-1 sm:flex-none h-11 px-6 rounded-2xl font-bold text-xs transition-all",
                  header.isFollowing && "border-secondary/30 text-secondary hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                )}
              >
                {header.isFollowing ? "دنبال می‌کنید" : "+ دنبال کردن"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-soft-border gap-6 sm:gap-10 text-sm font-bold bg-white px-6 rounded-2xl border">
          <button
            onClick={() => setActiveTab("rentals")}
            className={cn(
              "py-4 relative transition-colors flex items-center gap-2",
              activeTab === "rentals" ? "text-primary border-b-2 border-primary -mb-px font-black" : "text-secondary hover:text-brand"
            )}
          >
            <Home className="w-4 h-4" />
            <span>اقامتگاه‌ها ({toPersianDigits(header.listingsCount || 0)})</span>
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={cn(
              "py-4 relative transition-colors flex items-center gap-2",
              activeTab === "posts" ? "text-primary border-b-2 border-primary -mb-px font-black" : "text-secondary hover:text-brand"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>پست‌ها و راهنما ({toPersianDigits(header.postsCount || 0)})</span>
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={cn(
              "py-4 relative transition-colors flex items-center gap-2",
              activeTab === "about" ? "text-primary border-b-2 border-primary -mb-px font-black" : "text-secondary hover:text-brand"
            )}
          >
            <Info className="w-4 h-4" />
            <span>درباره میزبان و قوانین</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "rentals" && (
          <div className="space-y-6">
            {isLoadingRentals ? (
              <div className="text-center py-16 text-secondary text-sm font-bold animate-pulse">
                در حال بارگذاری لیست اقامتگاه‌ها...
              </div>
            ) : rentalsData?.items?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-soft-border space-y-2">
                <Home className="w-10 h-10 text-secondary/30 mx-auto" />
                <p className="text-sm font-bold text-brand">هنوز اقامتگاهی منتشر نشده است</p>
                <p className="text-xs text-secondary">اقامتگاه‌های جدید این میزبان به زودی اضافه خواهند شد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rentalsData?.items?.map((rental) => (
                  <Link
                    key={rental.id}
                    href={`/temporary-rent/${rental.id}`}
                    className="bg-white rounded-3xl overflow-hidden border border-soft-border hover:shadow-lg transition-all group flex flex-col"
                  >
                    <div className="relative h-48 w-full bg-soft-bg overflow-hidden">
                      {rental.mediaUrls?.[0] ? (
                        <Image
                          src={rental.mediaUrls[0]}
                          alt={rental.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary/40">
                          <Home className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-black text-brand text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {rental.title}
                        </h3>
                        {rental.address && (
                          <p className="text-xs text-secondary flex items-center gap-1 mt-1 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {rental.address}
                          </p>
                        )}
                      </div>
                      <div className="pt-3 border-t border-soft-border flex items-center justify-between text-xs">
                        <span className="text-secondary font-bold">هر شب از:</span>
                        <span className="font-black text-brand text-sm">
                          {formatCurrency(rental.basePricePerNight || rental.price || 0)} تومان
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-6">
            {isLoadingPosts ? (
              <div className="text-center py-16 text-secondary text-sm font-bold animate-pulse">
                در حال بارگذاری پست‌ها...
              </div>
            ) : postsData?.items?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-soft-border space-y-2">
                <Calendar className="w-10 h-10 text-secondary/30 mx-auto" />
                <p className="text-sm font-bold text-brand">هنوز مطلبی منتشر نشده است</p>
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
                          {post.category || "راهنمای اقامتگاه"}
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

        {activeTab === "about" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border space-y-6">
            <div>
              <h3 className="text-base font-black text-brand mb-2">درباره میزبان</h3>
              <p className="text-sm text-secondary font-medium leading-relaxed whitespace-pre-line">
                {about?.bio || "توضیحاتی ثبت نشده است."}
              </p>
            </div>

            {about?.address && (
              <div className="pt-4 border-t border-soft-border">
                <h4 className="text-xs font-bold text-secondary mb-1">محدوده اقامتگاه</h4>
                <p className="text-sm font-bold text-brand flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {about.address}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Modal */}
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
                {selectedPost.category || "راهنمای اقامتگاه"}
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
