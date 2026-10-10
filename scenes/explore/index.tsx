"use client";

import { PageSectionDivider } from "@/components/ui/PageSectionDivider";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteExplorePosts, useLikePost } from "@/hooks/usePosts";
import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { cn, getMediaPosterUrl, toPersianDigits } from "@/lib/utils";
import { RoleName } from "@/types/access";
import { UnifiedPost } from "@/types/api/post.types";
import {
  BookOpen,
  Building2,
  Eye,
  Grid,
  Heart,
  Hotel,
  Layers,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
  const mediaCount = post.mediaIds?.length || 0;
  const isMultiImage = mediaCount > 1;
  const isArticle = (post.content?.length || 0) > 400 || !!post.summary || post.category?.includes("مقاله");

  // Determine cover image URL
  const firstMedia = post.mediaIds?.[0];
  const coverUrl = firstMedia ? getMediaPosterUrl(firstMedia) : "/property-placeholder.svg";

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
  const [startPage, setStartPage] = useState<number>(1);

  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Sync url search param if changed externally
  useEffect(() => {
    const s = searchParams.get("search") || "";
    if (s !== activeSearch) {
      setSearchQuery(s);
      setActiveSearch(s);
      setStartPage(1);
    }
  }, [searchParams, activeSearch]);

  // Fetch explore posts with infinite query (batching up to 7 pages)
  const {
    data: postsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteExplorePosts(
    {
      limit: 16,
      search: activeSearch || undefined,
    },
    { startPage, maxPages: 7 }
  );

  // Auto-scroll infinite scroll up to 7 pages per batch
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const currentBatchPageCount = postsData?.pages.length ?? 0;
    if (currentBatchPageCount >= 7) return;
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, postsData?.pages.length]);

  // Pagination metrics
  const totalCount = postsData?.pages[0]?.total ?? 0;
  const limitPerPage = postsData?.pages[0]?.limit ?? 16;
  const totalPages = postsData?.pages[0]?.totalPages ?? Math.ceil(totalCount / limitPerPage);
  const lastLoadedPage = postsData?.pages[postsData.pages.length - 1]?.page ?? startPage;
  const isBatchFinished = (postsData?.pages.length ?? 0) >= 7 || !hasNextPage;
  const loadedPages = useMemo(() => postsData?.pages.map((p) => p.page) || [], [postsData]);

  // Flatten posts across loaded pages in current batch
  const allLoadedPosts = useMemo(() => {
    return postsData?.pages.flatMap((page) => page.items) || [];
  }, [postsData]);

  const handlePageSelect = (targetPage: number) => {
    const isLoadedInCurrentBatch = loadedPages.includes(targetPage);
    if (isLoadedInCurrentBatch) {
      if (targetPage === startPage) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const sectionElem = document.getElementById(`explore-page-section-${targetPage}`);
        if (sectionElem) {
          sectionElem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } else {
      setStartPage(targetPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (lastLoadedPage < totalPages) {
      handlePageSelect(lastLoadedPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (startPage > 1) {
      handlePageSelect(Math.max(1, startPage - 7));
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setActiveSearch(trimmed);
    setStartPage(1);

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
    setStartPage(1);

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
      <div >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در تصاویر، مقالات، تحلیل‌ها و اخبار ملکی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-28 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                title="پاک کردن جستجو"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all"
            >
              جستجو
            </button>
          </form>

          {canCreatePost && (
            <Link
              href="/posts/create"
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 text-primary" />
              <span>ایجاد پست جدید</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── INSTAGRAM-STYLE EXPLORE GRID WITH BATCHED INFINITE SCROLL ─── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-12">
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
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      ) : allLoadedPosts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-black text-brand">پستی با این مشخصات یافت نشد</p>
          <p className="text-xs text-slate-400">می‌توانید عبارت جستجو را تغییر داده یا بررسی کنید.</p>
          {activeSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-2 px-4 py-2 bg-slate-100 text-brand text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-6">
          {postsData?.pages.map((page, pageIndex) => {
            const pagePosts = page.items;
            if (pagePosts.length === 0 && pageIndex > 0) return null;

            return (
              <React.Fragment key={`explore-page-${page.page}`}>
                {/* Page Section Divider for page 2 onwards */}
                {pageIndex > 0 && (
                  <PageSectionDivider
                    id={`explore-page-section-${page.page}`}
                    page={page.page}
                    count={pagePosts.length}
                    itemLabel="پست"
                  />
                )}

                {pagePosts.map((post) => (
                  <ExplorePostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {/* Infinite scroll sentinel (auto-loads up to 7 pages per batch) */}
          {hasNextPage && (postsData?.pages.length ?? 0) < 7 && (
            <div
              ref={observerTargetRef}
              className="col-span-full py-8 flex flex-col items-center justify-center gap-2"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-white px-5 py-2.5 rounded-xl shadow-xs border border-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>در حال بارگذاری بخش بعدی پست‌ها...</span>
                </div>
              ) : (
                <div className="h-6" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls at the End of Batch */}
      {!isLoading && allLoadedPosts.length > 0 && totalPages > 1 && isBatchFinished && (
        <PaginationControls
          startPage={startPage}
          lastLoadedPage={lastLoadedPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemLabel="پست"
          loadedPages={loadedPages}
          onPageSelect={handlePageSelect}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onScrollToTop={handleScrollToTop}
          className="mb-8"
        />
      )}

    </div>
  );
}
