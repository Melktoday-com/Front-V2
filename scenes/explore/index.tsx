"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteExplorePosts, useLikePost } from "@/hooks/usePosts";
import { useSearchPosts } from "@/hooks/useSearch";
import { useAuth } from "@/hooks/useAuth";
import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { getMediaUrl, getMediaPosterUrl, toPersianDigits, cn } from "@/lib/utils";
import { UnifiedPost, PublisherType } from "@/types/api/post.types";
import {
  Search,
  Plus,
  Heart,
  Eye,
  Layers,
  BookOpen,
  Building2,
  Hotel,
  ShieldCheck,
  Verified,
  Filter,
  Loader2,
  Calendar,
  Grid,
  TrendingUp,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

const TOPIC_TAGS = [
  { id: "all", label: "همه موضوعات" },
  { id: "market", label: "تحلیل بازار مسکن" },
  { id: "guide", label: "راهنمای خرید و رهن" },
  { id: "legal", label: "نکات حقوقی و قرارداد" },
  { id: "investment", label: "فرصت‌های سرمایه‌گذاری" },
  { id: "news", label: "اخبار و تحولات" },
  { id: "host", label: "اقامتگاه و بومگردی" },
];

const PUBLISHER_FILTERS: { id: "ALL" | PublisherType; label: string }[] = [
  { id: "ALL", label: "همه ناشران" },
  { id: "AGENCY", label: "آژانس‌های املاک" },
  { id: "HOST", label: "میزبان‌های اقامتگاه" },
  { id: "PLATFORM", label: "پلتفرم رسمی" },
];

/**
 * Individual Instagram-Style Explore Card with Viewport Observation
 */
function ExplorePostCard({
  post,
  onLike,
}: {
  post: UnifiedPost;
  onLike: (e: React.MouseEvent, postId: string) => void;
}) {
  const observerRef = usePostViewObserver(post.id);

  // Check format: multi-image, article, or single photo
  const isMultiImage = (post.mediaUrls?.length || 0) > 1;
  const isArticle = (post.content?.length || 0) > 400 || !!post.summary || post.category?.includes("مقاله");

  // Determine cover image URL
  const coverUrl = post.mediaUrls && post.mediaUrls[0] ? getMediaPosterUrl(post.mediaUrls[0]) : "/property-placeholder.svg";

  const publisherName =
    post.publisherType === "PLATFORM"
      ? "پلتفرم رسمی"
      : post.publisher?.name || (post.publisherType === "HOST" ? "میزبان" : "آژانس املاک");

  return (
    <div
      ref={observerRef}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300"
    >
      <Link href={`/posts/${encodeURIComponent(post.slug || post.id)}`} className="block w-full h-full">
        {/* Main Cover Image */}
        <img
          src={coverUrl}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/property-placeholder.svg";
          }}
        />

        {/* Top Badges (Multi-image or Article Indicator) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          {isMultiImage && (
            <div className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
          )}
          {isArticle && (
            <div className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Top Right: Category Pill */}
        {post.category && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white text-[10px] font-bold">
              {post.category}
            </span>
          </div>
        )}

        {/* Hover / Touch Instagram Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 text-white z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              {post.publisherType === "PLATFORM" && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
              {post.publisherType === "HOST" && <Hotel className="w-3.5 h-3.5 text-emerald-400" />}
              {post.publisherType === "AGENCY" && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
              <span className="truncate max-w-[120px]">{publisherName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black line-clamp-2 leading-snug">
              {post.title}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-white/20 text-[11px] font-bold">
              {/* Like trigger button */}
              <button
                type="button"
                onClick={(e) => onLike(e, post.id)}
                className="flex items-center gap-1 hover:text-red-400 transition-colors"
              >
                <Heart
                  className={cn(
                    "w-3.5 h-3.5",
                    post.hasLiked ? "text-red-500 fill-red-500" : ""
                  )}
                />
                <span>{toPersianDigits(post.likeCount || 0)}</span>
              </button>

              {/* Views */}
              <div className="flex items-center gap-1 text-slate-300">
                <Eye className="w-3.5 h-3.5" />
                <span>{toPersianDigits(post.viewCount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ExploreScene() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const likeMutation = useLikePost();

  const urlSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeSearch, setActiveSearch] = useState(urlSearch);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedPublisherType, setSelectedPublisherType] = useState<"ALL" | PublisherType>("ALL");

  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Fetch explore posts with infinite query when browsing
  const {
    data: postsData,
    isLoading: isFeedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteExplorePosts(
    {
      limit: 16,
    },
    { startPage: 1, maxPages: 10 }
  );

  // Search query via /search/posts when activeSearch is set
  const { data: searchPostsData, isLoading: isSearchLoading } = useSearchPosts(
    { query: activeSearch, limit: 24 },
    !!activeSearch
  );

  const isLoading = activeSearch ? isSearchLoading : isFeedLoading;

  // Infinite Scroll Trigger
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;
    if (!hasNextPage || isFetchingNextPage || !!activeSearch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const handleLike = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.info("برای پسندیدن پست، لطفاً ابتدا وارد شوید.");
      router.push("/auth?returnUrl=/explore");
      return;
    }
    likeMutation.mutate(postId);
  };

  // Flatten posts across pages (or search hits)
  const allLoadedPosts = useMemo(() => {
    if (activeSearch && searchPostsData) {
      return searchPostsData.hits.map(
        (doc): UnifiedPost => ({
          id: doc.id,
          authorUserId: doc.authorUserId,
          publisherType: doc.ownerType,
          publisherId: doc.ownerId,
          title: doc.title,
          slug: doc.slug || undefined,
          summary: doc.summary || undefined,
          content: doc.content,
          category: doc.category || undefined,
          mediaUrls: doc.mediaUrls || [],
          isPublished: doc.isPublished,
          isFeatured: doc.isFeatured,
          viewCount: doc.viewCount,
          likeCount: doc.likeCount,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })
      );
    }
    return postsData?.pages.flatMap((page) => page.items) || [];
  }, [activeSearch, searchPostsData, postsData]);

  // Filter posts by tag and publisher type
  const filteredPosts = useMemo(() => {
    return allLoadedPosts.filter((post) => {
      // Publisher Filter
      if (selectedPublisherType !== "ALL" && post.publisherType !== selectedPublisherType) {
        return false;
      }

      // Tag Filter
      if (selectedTag === "all") return true;
      const cat = (post.category || "").toLowerCase();
      const text = `${post.title || ""} ${post.summary || ""} ${post.content || ""} ${cat}`.toLowerCase();

      if (selectedTag === "market") return cat.includes("تحلیل") || cat.includes("بازار") || text.includes("بازار") || text.includes("قیمت");
      if (selectedTag === "guide") return cat.includes("راهنما") || cat.includes("خرید") || text.includes("راهنما");
      if (selectedTag === "legal") return cat.includes("حقوق") || text.includes("حقوق") || text.includes("سند") || text.includes("قرارداد");
      if (selectedTag === "investment") return cat.includes("سرمایه") || text.includes("سرمایه") || text.includes("سود");
      if (selectedTag === "news") return cat.includes("پلتفرم") || cat.includes("اخبار") || text.includes("خبر");
      if (selectedTag === "host") return post.publisherType === "HOST" || text.includes("اقامت") || text.includes("سوئیت") || text.includes("ویلا");
      return true;
    });
  }, [allLoadedPosts, selectedTag, selectedPublisherType]);

  return (
    <div className="min-w-0 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6" dir="rtl">

      {/* ── TOP ACTION & SEARCH BAR ────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در تصاویر، مقالات، تحلیل‌ها و اخبار ملکی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-24 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all"
            >
              جستجو
            </button>
          </form>

          <Link
            href="/posts/create"
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>ایجاد پست جدید</span>
          </Link>
        </div>

        {/* Publisher Types Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 pt-3">
          {PUBLISHER_FILTERS.map((pub) => {
            const isSelected = selectedPublisherType === pub.id;
            return (
              <button
                key={pub.id}
                type="button"
                onClick={() => setSelectedPublisherType(pub.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {pub.label}
              </button>
            );
          })}
        </div>

        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TOPIC_TAGS.map((tag) => {
            const isSelected = selectedTag === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border",
                  isSelected
                    ? "bg-primary text-slate-950 border-primary"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INSTAGRAM-STYLE EXPLORE GRID ───────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
          <p className="text-xs font-bold text-red-600">خطا در دریافت فید کاوش.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold"
          >
            تلاش مجدد
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-black text-brand">پستی با این مشخصات یافت نشد</p>
          <p className="text-xs text-slate-400">می‌توانید فیلترها را تغییر داده یا اولین پست را شما منتشر کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredPosts.map((post) => (
            <ExplorePostCard
              key={post.id}
              post={post}
              onLike={handleLike}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll observer target */}
      <div ref={observerTargetRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>در حال بارگذاری پست‌های بیشتر...</span>
          </div>
        )}
      </div>

    </div>
  );
}
