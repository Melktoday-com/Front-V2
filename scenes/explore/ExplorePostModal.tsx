"use client";

import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { cn, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { PUBLISHER_TYPES, UnifiedPost } from "@/types/api/post.types";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Hotel,
  Layers,
  Loader2,
  Share2,
  ShieldCheck,
  Verified,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

export interface ExplorePostModalProps {
  initialPostId: string | null;
  isOpen: boolean;
  onClose: () => void;
  posts: UnifiedPost[];
  onLike: (e: React.MouseEvent, postId: string) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
}

interface NormalizedMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  posterUrl: string;
}

/**
 * Checks if a post is a detailed article (long content, markdown, summary, or category 'مقاله')
 */
function isDetailedArticle(post: UnifiedPost): boolean {
  if (post.summary && post.summary.trim().length > 0) return true;
  if (post.category?.includes("مقاله")) return true;
  if (post.content?.includes("## ")) return true;
  if ((post.content?.length || 0) > 220) return true;
  return false;
}

/**
 * Single Instagram-Style Feed Item in the Vertical Scroll Stream
 */
function ExploreFeedItem({
  post,
  onLike,
}: {
  post: UnifiedPost;
  onLike: (e: React.MouseEvent, postId: string) => void;
}) {
  const observerRef = usePostViewObserver(post.id);
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, boolean>>({});
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Optimistic local like state
  const [localLiked, setLocalLiked] = useState<boolean>(Boolean(post.hasLiked));
  const [localLikeCount, setLocalLikeCount] = useState<number>(post.likeCount || 0);

  useEffect(() => {
    setLocalLiked(Boolean(post.hasLiked));
    setLocalLikeCount(post.likeCount || 0);
  }, [post.hasLiked, post.likeCount]);

  // Canonical media list
  const mediaList = useMemo<NormalizedMediaItem[]>(() => {
    if (!post?.mediaIds || post.mediaIds.length === 0) return [];
    return post.mediaIds.map((item, idx) => ({
      id: item.id || `media-${idx}`,
      type: item.type,
      url: getMediaUrl(item),
      posterUrl: getMediaPosterUrl(item),
    }));
  }, [post]);

  useEffect(() => {
    setActiveSlide(0);
    if (swiperRef.current) {
      swiperRef.current.slideTo(0, 0);
    }
  }, [post.id]);

  // Publisher details
  const publisherInfo = useMemo(() => {
    if (!post) return null;

    if (
      post.publisherType === PUBLISHER_TYPES.PLATFORM ||
      post.publisherId === "melktoday-official"
    ) {
      return {
        name: post.publisher?.name || "ملک‌تودی (پلتفرم رسمی)",
        badge: "پلتفرم رسمی",
        logoUrl: post.publisher?.logoUrl || post.publisher?.avatarUrl || "/apple-touch-icon.png",
        type: PUBLISHER_TYPES.PLATFORM,
        isVerified: true,
      };
    }

    if (post.publisherType === PUBLISHER_TYPES.HOST) {
      const host = post.publisher;
      return {
        name: host?.name || "میزبان اقامتگاه",
        badge: "میزبان اقامتگاه",
        logoUrl: host?.logoUrl || host?.avatarUrl || null,
        type: PUBLISHER_TYPES.HOST,
        isVerified: host?.isVerified ?? false,
      };
    }

    const agency = post.publisher || post.agency;
    return {
      name: agency?.name || "آژانس املاک",
      badge: "آژانس املاک",
      logoUrl: agency?.logoUrl || agency?.avatarUrl || null,
      type: PUBLISHER_TYPES.AGENCY,
      isVerified: agency?.isVerified ?? true,
    };
  }, [post]);

  const formattedDate = useMemo(() => {
    if (!post?.createdAt) return "";
    try {
      return new Date(post.createdAt).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [post?.createdAt]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalLiked((prev) => {
      const nextVal = !prev;
      setLocalLikeCount((count) => (nextVal ? count + 1 : Math.max(0, count - 1)));
      return nextVal;
    });
    onLike(e, post.id);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (!localLiked) {
      handleLikeClick(e);
    }
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const shareText = `${post.title}\n${post.summary || ""}\nملک‌تودی`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => { });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title}\n${window.location.href}`);
      toast.success("اطلاعات پست کپی شد.");
    }
  };

  const isDetailed = isDetailedArticle(post);

  return (
    <article
      ref={observerRef}
      id={`explore-feed-post-${post.id}`}
      className="bg-surface rounded-none sm:rounded-3xl border-y sm:border border-border-subtle shadow-none sm:shadow-sm overflow-hidden text-right transition-all scroll-mt-20"
      dir="rtl"
    >
      {/* ── 1. POST HEADER (Publisher Info) ─────────────────────────────── */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border-subtle bg-surface">
        {publisherInfo && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-full p-0.5 border border-primary bg-primary/10 shrink-0 overflow-hidden">
              {publisherInfo.logoUrl ? (
                <Image
                  src={getMediaUrl(publisherInfo.logoUrl)}
                  alt={publisherInfo.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-secondary text-foreground-secondary font-bold text-xs rounded-full">
                  {publisherInfo.type === PUBLISHER_TYPES.PLATFORM ? (
                    <ShieldCheck className="w-4 h-4 text-brand" />
                  ) : publisherInfo.type === PUBLISHER_TYPES.HOST ? (
                    <Hotel className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Building2 className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-black text-brand truncate">
                  {publisherInfo.name}
                </span>
                {publisherInfo.isVerified && (
                  <Verified className="w-3.5 h-3.5 text-primary fill-primary/10 shrink-0" />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-foreground-muted">
                {publisherInfo.badge}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. MEDIA CAROUSEL (Images & Videos with Swiper) ──────────────── */}
      <div className="relative aspect-square sm:aspect-4/5 w-full bg-slate-950 overflow-hidden select-none group">
        {mediaList.length > 0 ? (
          <div className="absolute inset-0">
            <Swiper
              dir="rtl"
              slidesPerView={1}
              spaceBetween={0}
              threshold={5}
              touchStartPreventDefault={false}
              grabCursor={mediaList.length > 1}
              allowTouchMove={mediaList.length > 1}
              resistance={true}
              resistanceRatio={0.6}
              watchOverflow={true}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => {
                setActiveSlide(swiper.activeIndex);
                const container = swiper.el;
                const videos = container?.querySelectorAll("video");
                videos?.forEach((v) => {
                  if (!v.paused) v.pause();
                });
              }}
              className="w-full h-full"
            >
              {mediaList.map((media, idx) => (
                <SwiperSlide key={media.id || idx} className="w-full h-full">
                  <div
                    className="relative w-full h-full flex items-center justify-center cursor-pointer select-none bg-slate-950"
                    onDoubleClick={handleDoubleTap}
                  >
                    {media.type === "VIDEO" ? (
                      videoErrorMap[media.id] ? (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none text-white">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                            <Video className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold">ویدئو در حال پردازش است</span>
                          <span className="text-xs text-white/50 mt-1">
                            لطفاً اندکی بعد صفحه را بازبینی فرمایید
                          </span>
                        </div>
                      ) : (
                        <video
                          key={media.id}
                          src={media.url}
                          poster={media.posterUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain swiper-no-swiping"
                          onError={() => {
                            setVideoErrorMap((prev) => ({ ...prev, [media.id]: true }));
                          }}
                        />
                      )
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={media.id}
                        src={media.url}
                        alt={post.title || `تصویر ${idx + 1}`}
                        draggable={false}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/property-placeholder.svg";
                        }}
                      />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Double tap heart animation */}
            {showHeartBurst && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none animate-in fade-in zoom-in duration-300 z-30">
                <Heart className="w-24 h-24 text-error fill-red-500 drop-shadow-2xl" />
              </div>
            )}

            {/* Multi-image slide counter badge */}
            {mediaList.length > 1 && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-xs z-20 pointer-events-none">
                {toPersianDigits(activeSlide + 1)} / {toPersianDigits(mediaList.length)}
              </div>
            )}

            {/* Slide Navigation Chevrons inside media */}
            {mediaList.length > 1 && (
              <>
                {activeSlide > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      swiperRef.current?.slidePrev();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/80 hover:bg-surface text-foreground flex items-center justify-center shadow-md transition-all z-20 cursor-pointer"
                    title="اسلاید قبلی"
                    aria-label="اسلاید قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {activeSlide < mediaList.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      swiperRef.current?.slideNext();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/80 hover:bg-surface text-foreground flex items-center justify-center shadow-md transition-all z-20 cursor-pointer"
                    title="اسلاید بعدی"
                    aria-label="اسلاید بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {/* Slide Indicator Dots */}
            {mediaList.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
                {mediaList.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      swiperRef.current?.slideTo(dotIdx);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all cursor-pointer",
                      dotIdx === activeSlide
                        ? "w-5 bg-white shadow-xs"
                        : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                    aria-label={`اسلاید ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2 min-h-[260px]">
            <Layers className="w-12 h-12 text-slate-500" />
            <p className="text-xs font-bold">تصویری برای این پست ثبت نشده است.</p>
          </div>
        )}
      </div>

      {/* ── 3. ACTION BAR (Like, Share, Views) ───────────────────────────── */}
      <div className="p-3.5 sm:p-4 border-b border-border-subtle bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeClick}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer",
              localLiked
                ? "bg-error-subtle text-error border border-error/30 shadow-2xs"
                : "bg-surface-secondary hover:bg-slate-200 text-foreground-secondary"
            )}
            title="پسندیدن"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-transform active:scale-125",
                localLiked ? "fill-red-500 text-error" : ""
              )}
            />
            <span>{toPersianDigits(localLikeCount)}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-surface-secondary hover:bg-slate-200 text-foreground-secondary text-xs font-bold transition-all cursor-pointer"
            title="اشتراک‌گذاری"
          >
            <Share2 className="w-4 h-4" />
            <span>اشتراک</span>
          </button>
        </div>

        {/* View Count */}
        <div className="flex items-center gap-1 text-xs font-bold text-foreground-muted">
          <Eye className="w-4 h-4" />
          <span>{toPersianDigits(post.viewCount || 0)} بازدید</span>
        </div>
      </div>

      {/* ── 4. CAPTION & ARTICLE PREVIEW (With 'نمایش بیشتر' Button) ───── */}
      <div className="p-4 sm:p-5 space-y-2.5 bg-surface text-right select-text">
        <h3 className="text-sm sm:text-base font-black text-brand leading-snug">
          {post.title}
        </h3>

        {isDetailed ? (
          /* Detailed Article: Truncated preview with 'نمایش بیشتر' button to single post */
          <div className="space-y-2">
            {post.summary ? (
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed bg-surface-secondary/70 p-3 rounded-2xl border-r-3 border-primary">
                {post.summary}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed line-clamp-3">
                {post.content}
              </p>
            )}

            <div className="pt-1 flex justify-center">
              <Link
                href={`/posts/${encodeURIComponent(post.slug || post.id)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black transition-colors cursor-pointer group"
              >
                <span>نمایش بیشتر و مطالعه کامل مقاله</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* Short Post: Render full caption */
          <p className="text-xs sm:text-sm text-foreground-secondary leading-loose whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Date Timestamp */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted pt-2 border-t border-border-subtle/60">
            <Calendar className="w-3.5 h-3.5 text-foreground-muted" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Explore Feed Modal Overlay:
 * Provides an Instagram-style vertical scroll stream of single posts.
 */
export function ExplorePostModal({
  initialPostId,
  isOpen,
  onClose,
  posts,
  onLike,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
}: ExplorePostModalProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll when feed is open
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Jump to the clicked post on initial open
  useEffect(() => {
    if (!isOpen || !initialPostId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`explore-feed-post-${initialPostId}`);
      if (el) {
        el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [isOpen, initialPostId]);

  // Keyboard navigation: Escape closes feed
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Infinite scroll observer for loading more pages as user scrolls down
  useEffect(() => {
    const target = sentinelRef.current;
    if (!isOpen || !target || !hasNextPage || isFetchingNextPage || !onFetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onFetchNextPage();
        }
      },
      { rootMargin: "450px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isOpen, hasNextPage, isFetchingNextPage, onFetchNextPage]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="فید کاوش"
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* ── STICKY TOP BAR ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-subtle py-3 px-4 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-slate-200 text-brand text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به کاوش</span>
          </button>



          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-secondary transition-colors cursor-pointer"
            title="بستن (Esc)"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── VERTICAL FEED STREAM (Scroll Down) ─────────────────────────── */}
      <div className="max-w-xl mx-auto py-0 sm:py-6 px-0 space-y-3 sm:space-y-8 pb-24">
        {posts.map((post) => (
          <ExploreFeedItem
            key={post.id}
            post={post}
            onLike={onLike}
          />
        ))}

        {/* Sentinel for infinite scroll down */}
        {hasNextPage && (
          <div
            ref={sentinelRef}
            className="py-8 flex flex-col items-center justify-center gap-2"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface px-5 py-2.5 rounded-xl shadow-xs border border-border-subtle">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>در حال دریافت پست‌های بیشتر...</span>
              </div>
            ) : (
              <div className="h-6" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
