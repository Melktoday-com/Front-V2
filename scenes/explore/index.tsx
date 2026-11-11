"use client";

import { useAuth } from "@/hooks/useAuth";
import { useInfiniteExplorePosts, useLikePost } from "@/hooks/usePosts";
import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { cn, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { RoleName } from "@/types/access";
import { PUBLISHER_TYPES, UnifiedPost } from "@/types/api/post.types";
import {
  BookOpen,
  Building2,
  Eye,
  Grid,
  Heart,
  Hotel,
  Layers,
  Loader2,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExplorePostModal } from "./ExplorePostModal";

/**
 * Individual Instagram-Style Explore Card with Viewport Observation
 */
function ExplorePostCard({
  post,
  onLike,
  onSelect,
}: {
  post: UnifiedPost;
  onLike: (e: React.MouseEvent, postId: string) => void;
  onSelect: (post: UnifiedPost) => void;
}) {
  const observerRef = usePostViewObserver(post.id);

  // Determine cover image URL & media type
  const firstMedia = post.mediaIds?.[0];
  const coverUrl = firstMedia ? getMediaPosterUrl(firstMedia) : "/property-placeholder.svg";

  // Check format: video, multi-image, article
  const mediaCount = post.mediaIds?.length || 0;
  const isMultiImage = mediaCount > 1;
  const isArticle = (post.content?.length || 0) > 400 || !!post.summary || post.category?.includes("مقاله");
  const isVideo = firstMedia?.type === "VIDEO" || post.mediaIds?.some((m) => m.type === "VIDEO");

  const publisher = post.publisher || post.agency;
  const publisherName =
    post.publisherType === PUBLISHER_TYPES.PLATFORM
      ? (publisher?.name || "پلتفرم رسمی")
      : publisher?.name || (post.publisherType === PUBLISHER_TYPES.HOST ? "میزبان" : "آژانس املاک");
  const publisherLogo = publisher?.logoUrl || publisher?.avatarUrl;

  return (
    <article
      ref={observerRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(post)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(post);
        }
      }}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-border-subtle/80 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer select-none text-right focus:outline-hidden focus:ring-2 focus:ring-primary/50"
      aria-label={post.title}
    >
      {/* Main Cover Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/property-placeholder.svg";
        }}
      />

      {/* Top Badges (Video, Multi-image or Article Indicator) */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
        {isVideo && (
          <div className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs" title="ویدئو">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        )}
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
            {publisherLogo ? (
              <Image
                src={getMediaUrl(publisherLogo)}
                alt={publisherName}
                className="w-4 h-4 rounded-full object-cover shrink-0"
                width={16}
                height={16}
              />
            ) : null}
            {post.publisherType === PUBLISHER_TYPES.PLATFORM && <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />}
            {post.publisherType === PUBLISHER_TYPES.HOST && <Hotel className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {post.publisherType === PUBLISHER_TYPES.AGENCY && <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            <span className="truncate max-w-[120px]">{publisherName}</span>
            {publisher?.isVerified && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="تایید شده" />
            )}
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
              onClick={(e) => {
                e.stopPropagation();
                onLike(e, post.id);
              }}
              className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5",
                  post.hasLiked ? "text-error fill-red-500" : ""
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
    </article>
  );
}

export default function ExploreScene() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, activeRole } = useAuth();
  const likeMutation = useLikePost();

  const canCreatePost =
    isLoggedIn &&
    (activeRole === RoleName.Admin ||
      activeRole === RoleName.SuperAdmin ||
      activeRole === RoleName.Agent ||
      activeRole === RoleName.Landlord);

  const urlSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeSearch, setActiveSearch] = useState(urlSearch);

  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Sync url search param if changed externally
  useEffect(() => {
    const s = searchParams.get("search") || "";
    if (s !== activeSearch) {
      setSearchQuery(s);
      setActiveSearch(s);
    }
  }, [searchParams, activeSearch]);

  // Fetch explore posts with continuous infinite query
  const {
    data: postsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteExplorePosts({
    limit: 16,
    search: activeSearch || undefined,
  });

  // Auto-scroll infinite scroll
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "450px" }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten posts across loaded pages
  const allLoadedPosts = useMemo(() => {
    return postsData?.pages.flatMap((page) => page.items) || [];
  }, [postsData]);

  // Selected post ID to open the vertical scroll feed stream
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setActiveSearch(trimmed);

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    router.replace(`/explore${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.replace(`/explore${params.toString() ? `?${params.toString()}` : ""}`);
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

  return (
    <div className="min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 lg:pb-8 space-y-6" dir="rtl">

      {/* ── TOP ACTION & SEARCH BAR ────────────────────────────────────── */}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="جستجو در پست‌ها و مقالات اخبار ملک"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-24 py-3 rounded-2xl
               bg-surface-secondary border border-border-subtle text-xs 
               sm:text-sm text-foreground focus:bg-surface
                focus:border-primary focus:outline-hidden 
                transition-all placeholder:text-[11px] 
                sm:placeholder:text-xs placeholder:text-foreground-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute left-20 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground-secondary rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              title="پاک کردن جستجو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all cursor-pointer"
          >
            جستجو
          </button>
        </form>

        {canCreatePost && (
          <Link
            href="/posts/create"
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>ایجاد پست جدید</span>
          </Link>
        )}
      </div>


      {/* ── INSTAGRAM-STYLE CONTINUOUS INFINITE SCROLL EXPLORE GRID ──── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-12">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-2xl bg-surface-secondary animate-pulse border border-border-subtle/60"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface p-8 rounded-3xl border border-border-subtle text-center space-y-4">
          <p className="text-xs font-bold text-error">خطا در دریافت فید کاوش.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      ) : allLoadedPosts.length === 0 ? (
        <div className="bg-surface p-12 rounded-3xl border border-border-subtle text-center space-y-3">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-black text-brand">پستی با این مشخصات یافت نشد</p>
          <p className="text-xs text-foreground-muted">می‌توانید عبارت جستجو را تغییر داده یا بررسی کنید.</p>
          {activeSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-2 px-4 py-2 bg-surface-secondary text-brand text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-8">
          {allLoadedPosts.map((post) => (
            <ExplorePostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onSelect={(p) => setSelectedPostId(p.id)}
            />
          ))}

          {/* Infinite scroll sentinel & loader */}
          {hasNextPage && (
            <div
              ref={observerTargetRef}
              className="col-span-full py-8 flex flex-col items-center justify-center gap-2"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface px-5 py-2.5 rounded-xl shadow-xs border border-border-subtle">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>در حال بارگذاری بخش بعدی پست‌ها...</span>
                </div>
              ) : (
                <div className="h-6" />
              )}
            </div>
          )}

          {!hasNextPage && allLoadedPosts.length > 16 && (
            <div className="col-span-full py-8 text-center text-xs text-foreground-muted font-medium">
              همه پست‌ها نمایش داده شدند
            </div>
          )}
        </div>
      )}

      {/* Instagram Explore Vertical Scroll Feed Overlay */}
      <ExplorePostModal
        initialPostId={selectedPostId}
        isOpen={Boolean(selectedPostId)}
        onClose={() => setSelectedPostId(null)}
        posts={allLoadedPosts}
        onLike={handleLike}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        onFetchNextPage={() => fetchNextPage()}
      />

    </div>
  );
}
