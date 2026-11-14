"use client";

import { useAuth } from "@/hooks/useAuth";
import { useInfiniteExplorePosts, useLikePost } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";
import { RoleName } from "@/types/access";
import {
  ChevronRight,
  Grid,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExploreFeedCard, FeedCardLoadPriority } from "./ExploreFeedCard";
import { ExploreGridCard } from "./ExploreGridCard";

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

  // ── URL Query Parameters ──────────────────────────────────────────
  const viewParam = searchParams.get("view");
  const isFeedMode = viewParam === "feed";
  const urlPostId = searchParams.get("post");

  const urlSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeSearch, setActiveSearch] = useState(urlSearch);

  // ── Feed Viewport, Scroll & Priority State ─────────────────────────
  const [activeFeedPostId, setActiveFeedPostId] = useState<string | null>(urlPostId);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up" | "none">("none");
  const lastActiveIndexRef = useRef<number>(-1);
  const gridScrollYRef = useRef<number>(0);
  const isObserverLockedRef = useRef<boolean>(true);
  const replaceStateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);
  const hasPerformedInitialFocusRef = useRef<string | null>(null);

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

  // Infinite scroll sentinel
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
      { rootMargin: "600px" }
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

  // ── Instant Jump to Target Post (Eliminates showing from beginning) ─
  useEffect(() => {
    if (!isFeedMode || !urlPostId || allLoadedPosts.length === 0) return;
    if (hasPerformedInitialFocusRef.current === urlPostId) return;

    const targetEl = document.getElementById(`explore-feed-post-${urlPostId}`);
    if (targetEl) {
      hasPerformedInitialFocusRef.current = urlPostId;
      isObserverLockedRef.current = true;
      setActiveFeedPostId(urlPostId);
      lastActiveIndexRef.current = allLoadedPosts.findIndex((p) => p.id === urlPostId);

      // Instant jump directly to target post so post #1 is NEVER shown
      targetEl.scrollIntoView({ behavior: "instant", block: "start" });

      // Unlock observer only after DOM scroll has settled
      const timer = setTimeout(() => {
        isObserverLockedRef.current = false;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isFeedMode, urlPostId, allLoadedPosts]);

  // ── Throttled Intersection Observer for Feed Scroll ────────────────
  useEffect(() => {
    if (!isFeedMode || typeof IntersectionObserver === "undefined") return;

    const feedObserver = new IntersectionObserver(
      (entries) => {
        if (isObserverLockedRef.current) return;

        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length === 0) return;

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topEntry = visibleEntries[0];
        const postId = topEntry.target.getAttribute("data-post-id");
        if (!postId) return;

        const newIndex = allLoadedPosts.findIndex((p) => p.id === postId);
        if (newIndex !== -1 && newIndex !== lastActiveIndexRef.current) {
          const prevIndex = lastActiveIndexRef.current;
          if (prevIndex !== -1) {
            setScrollDirection(newIndex > prevIndex ? "down" : "up");
          }
          lastActiveIndexRef.current = newIndex;
          setActiveFeedPostId(postId);

          // Throttled URL sync to prevent main thread blocking while scrolling
          if (replaceStateTimerRef.current) {
            clearTimeout(replaceStateTimerRef.current);
          }
          replaceStateTimerRef.current = setTimeout(() => {
            if (typeof window !== "undefined") {
              const params = new URLSearchParams(window.location.search);
              params.set("view", "feed");
              params.set("post", postId);
              window.history.replaceState(null, "", `/explore?${params.toString()}`);
            }
          }, 120);
        }
      },
      {
        rootMargin: "-25% 0px -25% 0px",
        threshold: 0.4,
      }
    );

    allLoadedPosts.forEach((post) => {
      const el = document.getElementById(`explore-feed-post-${post.id}`);
      if (el) {
        el.setAttribute("data-post-id", post.id);
        feedObserver.observe(el);
      }
    });

    return () => {
      feedObserver.disconnect();
      if (replaceStateTimerRef.current) {
        clearTimeout(replaceStateTimerRef.current);
      }
    };
  }, [isFeedMode, allLoadedPosts]);

  // ── High Performance Load Priority Calculation ─────────────────────
  const getCardLoadPriority = useCallback(
    (index: number): FeedCardLoadPriority => {
      const activeId = activeFeedPostId || urlPostId;
      const targetIdx = activeId
        ? allLoadedPosts.findIndex((p) => p.id === activeId)
        : 0;

      const resolvedTarget = targetIdx !== -1 ? targetIdx : 0;

      if (index === resolvedTarget) {
        return "active";
      }

      if (scrollDirection === "down") {
        if (index === resolvedTarget + 1) return "preload";
        if (index === resolvedTarget - 1) return "preload";
      } else if (scrollDirection === "up") {
        if (index === resolvedTarget - 1) return "preload";
        if (index === resolvedTarget + 1) return "preload";
      } else {
        if (index === resolvedTarget + 1 || index === resolvedTarget - 1) {
          return "preload";
        }
      }

      return "idle";
    },
    [activeFeedPostId, urlPostId, allLoadedPosts, scrollDirection]
  );

  // ── Switch Handlers ────────────────────────────────────────────────
  const handleSelectPostFromGrid = (postId: string) => {
    // Record current grid scroll position to restore smoothly when going back
    gridScrollYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    isObserverLockedRef.current = true;
    hasPerformedInitialFocusRef.current = postId;
    setActiveFeedPostId(postId);
    lastActiveIndexRef.current = allLoadedPosts.findIndex((p) => p.id === postId);
    setScrollDirection("none");

    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "feed");
    params.set("post", postId);
    router.push(`/explore?${params.toString()}`, { scroll: false });

    // Instantly jump to target post in next microtask
    setTimeout(() => {
      const targetEl = document.getElementById(`explore-feed-post-${postId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "instant", block: "start" });
      }
      setTimeout(() => {
        isObserverLockedRef.current = false;
      }, 150);
    }, 10);
  };

  const handleSwitchToGrid = () => {
    isObserverLockedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    params.delete("post");
    router.push(`/explore${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });

    // Restore exact grid scroll position
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: gridScrollYRef.current, behavior: "instant" });
      }
    }, 10);
  };

  const handleSwitchToFeed = () => {
    const firstPostId = allLoadedPosts[0]?.id;
    if (firstPostId) {
      handleSelectPostFromGrid(firstPostId);
    }
  };

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
    <div
      className={cn(
        "min-w-0 mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-28 lg:pb-12 space-y-6 transition-all",
        isFeedMode ? "max-w-2xl" : "max-w-6xl"
      )}
      dir="rtl"
    >
      {/* ── TOP ACTION BAR: Search, View Switcher & Create Post ─────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
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

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center p-1 rounded-2xl bg-surface-secondary border border-border-subtle">
            <button
              type="button"
              onClick={handleSwitchToGrid}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                !isFeedMode
                  ? "bg-surface text-brand shadow-xs"
                  : "text-foreground-muted hover:text-foreground-secondary"
              )}
              title="نمای شبکه‌ای"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">شبکه‌ای</span>
            </button>

            <button
              type="button"
              onClick={handleSwitchToFeed}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isFeedMode
                  ? "bg-surface text-brand shadow-xs"
                  : "text-foreground-muted hover:text-foreground-secondary"
              )}
              title="نمای تک‌ستونه فید"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">فید</span>
            </button>
          </div>

          {/* Create Post Button */}
          {canCreatePost && (
            <Link
              href="/posts/create"
              className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 text-accent" />
              <span className="hidden sm:inline">ایجاد پست جدید</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── FEED MODE BACK BUTTON BAR ─────────────────────────────────── */}
      {isFeedMode && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border-subtle shadow-2xs">
          <button
            type="button"
            onClick={handleSwitchToGrid}
            className="inline-flex items-center gap-2 text-xs font-black text-brand hover:text-primary transition-colors cursor-pointer group"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span>بازگشت به نمای شبکه‌ای</span>
          </button>

          <span className="text-[11px] font-bold text-foreground-muted">
            نمای تک‌ستونه فید
          </span>
        </div>
      )}

      {/* ── CONTENT (Grid vs Feed) ────────────────────────────────────── */}
      {isLoading ? (
        isFeedMode ? (
          <div className="space-y-6 pb-12">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl sm:rounded-3xl bg-surface border border-border-subtle p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary" />
                  <div className="w-32 h-3.5 bg-surface-secondary rounded-md" />
                </div>
                <div className="aspect-square sm:aspect-4/5 w-full bg-surface-secondary rounded-2xl" />
                <div className="h-4 bg-surface-secondary rounded-md w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-12">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl sm:rounded-3xl bg-surface-secondary animate-pulse border border-border-subtle/60"
              />
            ))}
          </div>
        )
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
          <p className="text-xs text-foreground-muted">
            می‌توانید عبارت جستجو را تغییر داده یا بررسی کنید.
          </p>
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
        <>
          {/* ── SINGLE-COLUMN FEED VIEW ───────────────────────────────── */}
          <div className={cn("space-y-6 sm:space-y-8 pb-8", !isFeedMode && "hidden")}>
            {allLoadedPosts.map((post, index) => (
              <ExploreFeedCard
                key={post.id}
                post={post}
                onLike={handleLike}
                loadPriority={getCardLoadPriority(index)}
              />
            ))}

            {/* Infinite scroll sentinel & loader for Feed */}
            {hasNextPage && isFeedMode && (
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

            {!hasNextPage && allLoadedPosts.length > 6 && isFeedMode && (
              <div className="py-8 text-center text-xs text-foreground-muted font-medium">
                همه پست‌ها نمایش داده شدند
              </div>
            )}
          </div>

          {/* ── GRID VIEW (DEFAULT) ───────────────────────────────────── */}
          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-8",
              isFeedMode && "hidden"
            )}
          >
            {allLoadedPosts.map((post) => (
              <ExploreGridCard
                key={post.id}
                post={post}
                onSelect={handleSelectPostFromGrid}
                onLike={handleLike}
              />
            ))}

            {/* Infinite scroll sentinel & loader for Grid */}
            {hasNextPage && !isFeedMode && (
              <div
                ref={observerTargetRef}
                className="col-span-full py-8 flex flex-col items-center justify-center gap-2"
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

            {!hasNextPage && allLoadedPosts.length > 12 && !isFeedMode && (
              <div className="col-span-full py-8 text-center text-xs text-foreground-muted font-medium">
                همه پست‌ها نمایش داده شدند
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
