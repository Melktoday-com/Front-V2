"use client";

import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { cn, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { POST_TYPES, PostType, PUBLISHER_TYPES, UnifiedPost } from "@/types/api/post.types";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Hotel,
  Layers,
  Play,
  Share2,
  ShieldCheck,
  Verified,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

interface NormalizedMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  posterUrl: string;
}

/**
 * Checks if a post is an article type (either explicitly from backend or based on content length/summary)
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

interface ExploreFeedCardProps {
  post: UnifiedPost;
  onLike: (e: React.MouseEvent, postId: string) => void;
}

export function ExploreFeedCard({ post, onLike }: ExploreFeedCardProps) {
  // Post view observer to count views when visible
  const viewObserverRef = usePostViewObserver(post.id);

  // Observer for in-view media loading to eliminate scrolling lag
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const swiperRef = useRef<SwiperType | null>(null);

  const [isInView, setIsInView] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, boolean>>({});
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // Optimistic like state
  const [localLiked, setLocalLiked] = useState<boolean>(Boolean(post.hasLiked));
  const [localLikeCount, setLocalLikeCount] = useState<number>(post.likeCount || 0);

  useEffect(() => {
    setLocalLiked(Boolean(post.hasLiked));
    setLocalLikeCount(post.likeCount || 0);
  }, [post.hasLiked, post.likeCount]);

  // Viewport IntersectionObserver: load heavy media only when in-view
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

        // Auto pause any playing video when scrolling out of view
        if (!visible) {
          Object.values(videoRefs.current).forEach((v) => {
            if (v && !v.paused) {
              v.pause();
            }
          });
        }
      },
      {
        rootMargin: "250px 0px",
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

  const isArticle = isArticlePost(post);
  const isInstagram = !isArticle;

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

  return (
    <article
      ref={setContainerRefs}
      id={`explore-feed-post-${post.id}`}
      className="bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle shadow-xs overflow-hidden text-right transition-all select-none"
      dir="rtl"
    >
      {/* ── 1. HEADER (Publisher Profile Info) ─────────────────────────── */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border-subtle bg-surface">
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

        {/* Post Type Badge */}
        <div className="flex items-center gap-2">
          {post.category && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-secondary text-[11px] font-bold text-foreground-secondary">
              {post.category}
            </span>
          )}
          {isArticle && (
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black">
              مقاله
            </span>
          )}
        </div>
      </div>

      {/* ── 2. MEDIA CAROUSEL (Images & Videos with Viewport Observer) ──── */}
      <div className="relative aspect-square sm:aspect-4/5 w-full bg-slate-950 overflow-hidden group">
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
                // Pause all videos when slide changes
                Object.values(videoRefs.current).forEach((v) => {
                  if (v && !v.paused) v.pause();
                });
              }}
              className="w-full h-full"
            >
              {mediaList.map((media, idx) => {
                const isCurrentSlide = idx === activeSlide;
                const shouldLoadMedia = isInView && Math.abs(idx - activeSlide) <= 1;

                return (
                  <SwiperSlide key={media.id || idx} className="w-full h-full">
                    <div
                      className="relative w-full h-full flex items-center justify-center select-none bg-slate-950 cursor-pointer"
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
                        ) : isInView && isCurrentSlide ? (
                          /* Active in-view video element */
                          <video
                            ref={(el) => {
                              videoRefs.current[media.id] = el;
                            }}
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
                        ) : (
                          /* Off-view or background slide: lightweight poster thumbnail */
                          <div className="relative w-full h-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={media.posterUrl || "/property-placeholder.svg"}
                              alt={post.title}
                              loading="lazy"
                              className="w-full h-full object-contain select-none pointer-events-none"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/property-placeholder.svg";
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-md">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        /* Image slide: prioritized in-view loading */
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={media.id}
                          src={shouldLoadMedia ? media.url : media.posterUrl || "/property-placeholder.svg"}
                          alt={post.title || `تصویر ${idx + 1}`}
                          loading={idx === 0 ? "eager" : "lazy"}
                          draggable={false}
                          className="w-full h-full object-contain select-none pointer-events-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/property-placeholder.svg";
                          }}
                        />
                      )}
                    </div>
                  </SwiperSlide>
                );
              })}
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

      {/* ── 4. CAPTION & ARTICLE SECTION ─────────────────────────────────── */}
      <div className="p-4 sm:p-5 space-y-2.5 bg-surface text-right select-text">
        <h3 className="text-sm sm:text-base font-black text-brand leading-snug">
          {post.title}
        </h3>

        {isArticle ? (
          /* ARTICLE POST: Excerpt with 'مشاهده بیشتر' linking to single post page */
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
