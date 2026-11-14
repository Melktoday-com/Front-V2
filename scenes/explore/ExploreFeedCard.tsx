"use client";

import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { cn, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { POST_TYPES, PostType, PUBLISHER_TYPES, UnifiedPost } from "@/types/api/post.types";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Hotel,
  Play,
  Share2,
  ShieldCheck,
  Verified,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface NormalizedMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  posterUrl: string;
}

/**
 * Checks if a post is an article type (explicitly from backend or based on length/summary)
 */
export function isArticlePost(post: UnifiedPost): boolean {
  if (post.postType === PostType.ARTICLE) return true;
  if (post.postType === PostType.SLIDE) return false;
  if (post.summary && post.summary.trim().length > 0) return true;
  if (post.category?.includes("مقاله")) return true;
  if (post.content?.includes("## ")) return true;
  if ((post.content?.length || 0) > 400) return true;
  return false;
}

export type FeedCardLoadPriority = "active" | "preload" | "idle";

interface ExploreFeedCardProps {
  post: UnifiedPost;
  onLike: (e: React.MouseEvent, postId: string) => void;
  loadPriority?: FeedCardLoadPriority;
}

export function ExploreFeedCard({
  post,
  onLike,
  loadPriority = "active",
}: ExploreFeedCardProps) {
  const viewObserverRef = usePostViewObserver(post.id);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isInView, setIsInView] = useState(loadPriority === "active");
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // Optimistic like state
  const [localLiked, setLocalLiked] = useState<boolean>(Boolean(post.hasLiked));
  const [localLikeCount, setLocalLikeCount] = useState<number>(post.likeCount || 0);

  useEffect(() => {
    setLocalLiked(Boolean(post.hasLiked));
    setLocalLikeCount(post.likeCount || 0);
  }, [post.hasLiked, post.likeCount]);

  // Viewport IntersectionObserver: auto-pause video when scrolling out
  useEffect(() => {
    const el = cardContainerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = Boolean(entry && entry.isIntersecting);
        setIsInView(visible);

        if (!visible && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      },
      {
        rootMargin: "200px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

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

  // Publisher details with link to showcase
  const publisherInfo = useMemo(() => {
    if (!post) return null;

    if (
      post.publisherType === PUBLISHER_TYPES.PLATFORM ||
      post.publisherId === "melktoday-official"
    ) {
      return {
        name: post.publisher?.name || "ملک‌تودی | MelkToday",
        link: "/platform",
        logoUrl: post.publisher?.logoUrl || post.publisher?.avatarUrl || "/apple-touch-icon.png",
        type: PUBLISHER_TYPES.PLATFORM,
        isVerified: true,
      };
    }

    if (post.publisherType === PUBLISHER_TYPES.HOST) {
      const host = post.publisher;
      const hostSlugOrId = host?.slug || host?.id || post.agencyId || post.publisherId;
      return {
        name: host?.name || "میزبان اقامتگاه",
        link: hostSlugOrId ? `/host/${encodeURIComponent(hostSlugOrId)}` : "/temporary-rent",
        logoUrl: host?.logoUrl || host?.avatarUrl || null,
        type: PUBLISHER_TYPES.HOST,
        isVerified: host?.isVerified ?? false,
      };
    }

    const agency = post.publisher || post.agency;
    const agencySlugOrId =
      agency?.slug || agency?.id || post.agencyId || post.publisherId;
    return {
      name: agency?.name || "آژانس املاک",
      link: agencySlugOrId
        ? `/agency/showcase/${encodeURIComponent(agencySlugOrId)}`
        : "/agency",
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
    const shareUrl = `${window.location.origin}/posts/${encodeURIComponent(post.slug || post.id)}`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title}\n${shareUrl}`);
      toast.success("لینک پست کپی شد.");
    }
  };

  // High performance slide scroll handler (LTR container for bulletproof cross-browser scrollLeft)
  const handleCarouselScroll = useCallback(() => {
    const el = carouselContainerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth || 1;
    const index = Math.round(scrollLeft / width);
    setActiveSlide(Math.max(0, Math.min(index, mediaList.length - 1)));
  }, [mediaList.length]);

  const scrollToSlide = (index: number) => {
    const el = carouselContainerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: index * width, behavior: "smooth" });
    setActiveSlide(index);
  };

  const isArticle = isArticlePost(post);

  // Instagram Caption Split logic
  const caption = post.content || "";
  const isLongCaption = caption.length > 130 || caption.split("\n").length > 3;
  const truncatedCaption = isLongCaption ? `${caption.slice(0, 130).trim()}...` : caption;

  // Connect both view observer and card container refs
  const setContainerRefs = (node: HTMLDivElement | null) => {
    cardContainerRef.current = node;
    if (viewObserverRef && "current" in viewObserverRef) {
      viewObserverRef.current = node;
    }
  };

  const isPriorityActive = loadPriority === "active" || (isInView && loadPriority !== "idle");
  const isPriorityPreload = loadPriority === "preload";
  const firstMedia = mediaList[0];

  return (
    <article
      ref={setContainerRefs}
      id={`explore-feed-post-${post.id}`}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0 600px",
      }}
      className="bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle shadow-xs overflow-hidden text-right transition-all select-none"
      dir="rtl"
    >
      {/* ── 1. HEADER (Publisher Profile Info: ONLY name & logo) ──────── */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border-subtle bg-surface">
        {publisherInfo && (
          <Link
            href={publisherInfo.link}
            className="flex items-center gap-2.5 min-w-0 group/pub hover:opacity-85 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            title={`مشاهده ویترین ${publisherInfo.name}`}
          >
            <div className="relative w-10 h-10 rounded-full p-0.5 border border-primary/25 bg-primary/5 shrink-0 overflow-hidden">
              {publisherInfo.logoUrl ? (
                <Image
                  src={getMediaUrl(publisherInfo.logoUrl)}
                  alt={publisherInfo.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full group-hover/pub:scale-105 transition-transform"
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
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-brand truncate group-hover/pub:text-primary transition-colors">
                  {publisherInfo.name}
                </span>
                {publisherInfo.isVerified && (
                  <Verified className="w-3.5 h-3.5 text-primary fill-primary/10 shrink-0" />
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Left Side: Formatted Date */}
        {formattedDate && (
          <span className="text-[11px] font-medium text-foreground-muted select-none">
            {formattedDate}
          </span>
        )}
      </div>

      {/* ── 2. ULTRA-PERFORMANT NATIVE MEDIA CAROUSEL (CSS Snap) ──────── */}
      <div className="relative aspect-square sm:aspect-4/5 sm:max-h-[520px] w-full bg-slate-950 overflow-hidden group">
        {mediaList.length > 0 ? (
          <div className="absolute inset-0">
            {/* If card is idle, only render lightweight placeholder / poster */}
            {!isPriorityActive && !isPriorityPreload ? (
              <div className="w-full h-full relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={firstMedia?.posterUrl || firstMedia?.url || "/property-placeholder.svg"}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {firstMedia?.type === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ) : !isPriorityActive && isPriorityPreload ? (
              /* Preload stage: eager load cover/first frame without mounting heavy video */
              <div className="w-full h-full relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={firstMedia?.posterUrl || firstMedia?.url || "/property-placeholder.svg"}
                  alt={post.title}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
                {firstMedia?.type === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Active stage: hardware-accelerated CSS scroll-snap carousel */
              <div
                ref={carouselContainerRef}
                dir="ltr"
                onScroll={handleCarouselScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none select-none touch-pan-x"
                style={{ scrollBehavior: "smooth" }}
              >
                {mediaList.map((media, idx) => {
                  const isCurrent = idx === activeSlide;

                  return (
                    <div
                      key={media.id}
                      className="w-full h-full shrink-0 snap-center snap-always relative bg-slate-950 flex items-center justify-center"
                    >
                      {media.type === "VIDEO" ? (
                        <div
                          className="relative w-full h-full flex items-center justify-center bg-black"
                          onDoubleClick={handleDoubleTap}
                        >
                          {videoError ? (
                            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                              <Video className="w-8 h-8 opacity-40" />
                              <p className="text-xs">خطا در بارگذاری ویدیو</p>
                            </div>
                          ) : (
                            <video
                              ref={isCurrent ? videoRef : undefined}
                              src={media.url}
                              poster={media.posterUrl}
                              controls
                              playsInline
                              preload={isCurrent && isInView ? "metadata" : "none"}
                              onError={() => setVideoError(true)}
                              className="w-full h-full object-contain bg-black"
                            />
                          )}
                        </div>
                      ) : (
                        <div
                          className="relative w-full h-full bg-slate-900 cursor-pointer"
                          onDoubleClick={handleDoubleTap}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={media.url}
                            alt={post.title}
                            loading={idx === 0 || isCurrent ? "eager" : "lazy"}
                            className="w-full h-full object-cover select-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/property-placeholder.svg";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Slide Index Pill indicator (Top-Right) */}
            {mediaList.length > 1 && (
              <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow-xs pointer-events-none">
                {toPersianDigits(activeSlide + 1)} / {toPersianDigits(mediaList.length)}
              </div>
            )}

            {/* Navigation Arrows for Multi-image */}
            {isPriorityActive && mediaList.length > 1 && (
              <>
                {activeSlide > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToSlide(activeSlide - 1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="اسلاید قبلی"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {activeSlide < mediaList.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToSlide(activeSlide + 1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="اسلاید بعدی"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Dot Pagination */}
                <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
                  {mediaList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`اسلاید ${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToSlide(i);
                      }}
                      className={cn(
                        "h-1.5 rounded-full transition-all pointer-events-auto",
                        i === activeSlide ? "w-5 bg-white" : "w-1.5 bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Heart burst animation on double tap */}
            {showHeartBurst && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <Heart className="w-20 h-20 fill-red-500 text-red-500 animate-ping opacity-90 drop-shadow-lg" />
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500">
            <p className="text-xs font-bold">تصویری برای این پست ثبت نشده است.</p>
          </div>
        )}
      </div>

      {/* ── 3. ACTION BAR (Like, Share, Views) ─────────────────────────── */}
      <div className="p-3 sm:p-4 border-b border-border-subtle bg-surface flex items-center justify-between">
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

      {/* ── 4. CAPTION & ARTICLE SECTION ───────────────────────────────── */}
      <div className="p-4 sm:p-5 space-y-2.5 bg-surface text-right select-text">
        <h3 className="text-sm sm:text-base font-black text-brand leading-snug">
          {post.title}
        </h3>

        {isArticle ? (
          /* ARTICLE POST: Excerpt with 'مشاهده بیشتر و مطالعه مقاله' */
          <div className="space-y-3">
            {post.summary ? (
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed bg-surface-secondary/70 p-3 rounded-2xl border-r-3 border-primary">
                {post.summary}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed line-clamp-3">
                {post.content}
              </p>
            )}

            <div className="pt-1 flex justify-start">
              <Link
                href={`/posts/${encodeURIComponent(post.slug || post.id)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black transition-colors cursor-pointer group"
              >
                <span>مشاهده بیشتر و مطالعه مقاله</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* INSTAGRAM / SLIDE POST: No link to single post; split and expand in-place */
          <div className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            {isLongCaption ? (
              <div>
                <p className={cn("whitespace-pre-wrap transition-all", !isCaptionExpanded && "line-clamp-2")}>
                  {isCaptionExpanded ? caption : truncatedCaption}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCaptionExpanded((prev) => !prev)}
                  className="mt-1 text-primary font-black hover:underline cursor-pointer inline-flex items-center gap-0.5 text-xs"
                >
                  {isCaptionExpanded ? "بستن توضیحات" : "بیشتر..."}
                </button>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{caption}</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
