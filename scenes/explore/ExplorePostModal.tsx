"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { PUBLISHER_TYPES, UnifiedPost } from "@/types/api/post.types";
import { postService } from "@/services/post.service";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Hotel,
  Layers,
  Share2,
  ShieldCheck,
  Verified,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface ExplorePostModalProps {
  post: UnifiedPost | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (e: React.MouseEvent, postId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

interface NormalizedMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  posterUrl: string;
}

export function ExplorePostModal({
  post,
  isOpen,
  onClose,
  onLike,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ExplorePostModalProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, boolean>>({});
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Optimistic like state for immediate feedback
  const [localLiked, setLocalLiked] = useState<boolean>(Boolean(post?.hasLiked));
  const [localLikeCount, setLocalLikeCount] = useState<number>(post?.likeCount || 0);

  // Sync state when active post changes
  useEffect(() => {
    if (post) {
      setActiveSlide(0);
      setVideoErrorMap({});
      setLocalLiked(Boolean(post.hasLiked));
      setLocalLikeCount(post.likeCount || 0);
    }
  }, [post?.id, post?.hasLiked, post?.likeCount]);

  // Record silent view impression for this post
  useEffect(() => {
    if (isOpen && post?.id) {
      postService.getPostByIdOrSlug(post.id).catch(() => {
        // Ignore background view logging failure
      });
    }
  }, [isOpen, post?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Keyboard navigation: Escape to close, Arrow keys for next/prev post
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        // In Persian RTL: Next post is toward the left
        if (hasNext && onNext) onNext();
      } else if (e.key === "ArrowRight") {
        // In Persian RTL: Previous post is toward the right
        if (hasPrev && onPrev) onPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

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
        link: "/platform",
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
        link: host?.slug ? `/host/${encodeURIComponent(host.slug)}` : `/host/${encodeURIComponent(post.publisherId)}`,
        logoUrl: host?.logoUrl || host?.avatarUrl || null,
        type: PUBLISHER_TYPES.HOST,
        isVerified: host?.isVerified ?? false,
      };
    }

    const agency = post.publisher || post.agency;
    const agencySlugOrId = agency?.slug || agency?.id || post.agencyId || post.publisherId;
    return {
      name: agency?.name || "آژانس املاک",
      badge: "آژانس املاک",
      link: agencySlugOrId ? `/agency/showcase/${encodeURIComponent(agencySlugOrId)}` : "/agency",
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
    if (!post) return;
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
    if (!localLiked && post) {
      handleLikeClick(e);
    }
  };

  const handleShare = () => {
    if (typeof window === "undefined" || !post) return;
    const shareText = `${post.title}\n${post.summary || ""}\nملک‌تودی`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title}\n${window.location.href}`);
      toast.success("اطلاعات پست کپی شد.");
    }
  };

  if (!isOpen || !post) return null;

  const currentMedia = mediaList[activeSlide] || mediaList[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      dir="rtl"
    >
      {/* Desktop Floating Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="hidden md:flex absolute top-5 left-5 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-lg hover:rotate-90"
        title="بستن"
        aria-label="بستن"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Desktop Floating Navigation Chevrons (Explore Instagram Style) */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev?.();
          }}
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md items-center justify-center shadow-2xl transition-all cursor-pointer z-50 hover:scale-110 active:scale-95"
          title="پست قبلی (کلید راست)"
          aria-label="پست قبلی"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md items-center justify-center shadow-2xl transition-all cursor-pointer z-50 hover:scale-110 active:scale-95"
          title="پست بعدی (کلید چپ)"
          aria-label="پست بعدی"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Main Instagram Explore Single Post Dialog Window */}
      <div
        className="relative w-full max-w-5xl bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[92vh] md:h-[620px] lg:h-[650px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MEDIA COLUMN (Desktop: Right 60% in RTL, Mobile: Top) ─────── */}
        <div className="w-full md:w-[58%] lg:w-[60%] bg-slate-950 relative flex items-center justify-center overflow-hidden shrink-0 aspect-square sm:aspect-4/5 md:aspect-auto md:h-full select-none group">
          {mediaList.length > 0 && currentMedia ? (
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer"
              onDoubleClick={handleDoubleTap}
            >
              {currentMedia.type === "VIDEO" ? (
                videoErrorMap[currentMedia.id] ? (
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
                    key={currentMedia.id}
                    src={currentMedia.url}
                    poster={currentMedia.posterUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full max-h-[50vh] md:max-h-full object-contain"
                    onError={() => {
                      setVideoErrorMap((prev) => ({ ...prev, [currentMedia.id]: true }));
                    }}
                  />
                )
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={currentMedia.id}
                  src={currentMedia.url}
                  alt={post.title || `تصویر ${activeSlide + 1}`}
                  className="w-full h-full max-h-[50vh] md:max-h-full object-contain select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/property-placeholder.svg";
                  }}
                />
              )}

              {/* Double tap heart animation */}
              {showHeartBurst && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none animate-in fade-in zoom-in duration-300 z-30">
                  <Heart className="w-24 h-24 text-error fill-red-500 drop-shadow-2xl" />
                </div>
              )}

              {/* Multi-image slide counter badge */}
              {mediaList.length > 1 && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-xs z-20">
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
                        setActiveSlide((s) => s - 1);
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
                        setActiveSlide((s) => s + 1);
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
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20">
                  {mediaList.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(dotIdx);
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
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2 min-h-[220px]">
              <Layers className="w-12 h-12 text-slate-500" />
              <p className="text-xs font-bold">تصویری برای این پست ثبت نشده است.</p>
            </div>
          )}
        </div>

        {/* ── DETAILS COLUMN (Desktop: Left 40% in RTL, Mobile: Bottom) ──── */}
        <div className="w-full md:w-[42%] lg:w-[40%] flex flex-col justify-between bg-surface border-t md:border-t-0 md:border-r border-border-subtle p-4 sm:p-5 min-w-0 flex-1 overflow-hidden">
          {/* Header: Publisher info & Close button */}
          <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle shrink-0 gap-2">
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

            <div className="flex items-center gap-2 shrink-0">
              {post.category && (
                <span className="px-2.5 py-1 rounded-full bg-surface-secondary text-foreground-secondary text-[11px] font-bold">
                  {post.category}
                </span>
              )}

              {/* Close button for mobile or inline */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-secondary transition-colors cursor-pointer"
                title="بستن"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Caption & Content Area */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-right select-text max-h-[320px] md:max-h-none">
            <h2 className="text-sm sm:text-base font-black text-brand leading-snug">
              {post.title}
            </h2>

            {post.summary && (
              <p className="text-xs text-foreground-secondary bg-surface-secondary/70 p-3 rounded-xl border-r-3 border-primary leading-relaxed">
                {post.summary}
              </p>
            )}

            <div className="text-xs sm:text-sm text-foreground-secondary leading-loose whitespace-pre-wrap select-text">
              {post.content}
            </div>

            {/* Date */}
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted pt-2 border-t border-border-subtle/60">
                <Calendar className="w-3.5 h-3.5 text-foreground-muted" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Footer: Interactions (Like, Share, Views) */}
          <div className="pt-3 border-t border-border-subtle shrink-0 space-y-2">
            <div className="flex items-center justify-between">
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

            {/* Mobile Navigation bar between posts */}
            {(hasPrev || hasNext) && (
              <div className="flex md:hidden items-center justify-between pt-2 border-t border-border-subtle/50 text-xs font-bold text-foreground-secondary">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>پست قبلی</span>
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  disabled={!hasNext}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>پست بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
