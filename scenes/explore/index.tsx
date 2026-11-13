"use client";

import { useAuth } from "@/hooks/useAuth";
import { useInfiniteExplorePosts, useLikePost } from "@/hooks/usePosts";
import { RoleName } from "@/types/access";
import {
  Grid,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExploreFeedCard } from "./ExploreFeedCard";

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
    limit: 12,
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
    <div className="min-w-0 max-w-2xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-28 lg:pb-12 space-y-6" dir="rtl">

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

      {/* ── SINGLE COLUMN EXPLORE FEED ──────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-6 pb-12">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl sm:rounded-3xl bg-surface border border-border-subtle p-4 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-secondary" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-surface-secondary rounded-md" />
                  <div className="w-20 h-2.5 bg-surface-secondary rounded-md" />
                </div>
              </div>
              <div className="aspect-square sm:aspect-4/5 w-full bg-surface-secondary rounded-2xl" />
              <div className="h-4 bg-surface-secondary rounded-md w-3/4" />
              <div className="h-3 bg-surface-secondary rounded-md w-1/2" />
            </div>
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
        <div className="space-y-6 sm:space-y-8 pb-8">
          {allLoadedPosts.map((post) => (
            <ExploreFeedCard
              key={post.id}
              post={post}
              onLike={handleLike}
            />
          ))}

          {/* Infinite scroll sentinel & loader */}
          {hasNextPage && (
            <div
              ref={observerTargetRef}
              className="py-8 flex flex-col items-center justify-center gap-2"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface px-5 py-2.5 rounded-xl shadow-xs border border-border-subtle">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>در حال بارگذاری پست‌های بیشتر...</span>
                </div>
              ) : (
                <div className="h-6" />
              )}
            </div>
          )}

          {!hasNextPage && allLoadedPosts.length > 8 && (
            <div className="py-8 text-center text-xs text-foreground-muted font-medium">
              همه پست‌ها نمایش داده شدند
            </div>
          )}
        </div>
      )}

    </div>
  );
}
