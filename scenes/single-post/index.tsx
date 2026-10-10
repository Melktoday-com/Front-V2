"use client";

import React, { useState, useMemo } from "react";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSinglePost, useLikePost } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { getMediaUrl, getMediaPosterUrl, toPersianDigits, cn } from "@/lib/utils";
import { UnifiedPost } from "@/types/api/post.types";
import {
  Heart,
  Share2,
  Eye,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  Hotel,
  ShieldCheck,
  Verified,
  Bookmark,
  Layers,
  Feather,
  BookOpen,
  MessageCircle,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SinglePostSceneProps {
  idOrSlug: string;
}

export default function SinglePostScene({ idOrSlug }: SinglePostSceneProps) {
  const router = useRouter();
  const handleBack = useSafeBack("/");
  const { isLoggedIn } = useAuth();
  const { data: post, isLoading, isError, refetch } = useSinglePost(idOrSlug);
  const likeMutation = useLikePost();

  // Active slide index for Instagram style
  const [activeSlide, setActiveSlide] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Viewport impression observer
  const observerRef = usePostViewObserver(post?.id, !!post?.id);

  // Resolve Publisher Metadata
  const publisherInfo = useMemo(() => {
    if (!post) return null;

    if (post.publisherType === "PLATFORM" || post.publisherId === "melktoday-official") {
      return {
        name: "ملک‌تودی (پلتفرم رسمی)",
        badge: "پلتفرم رسمی",
        link: "/platform",
        logoUrl: null,
        type: "PLATFORM" as const,
        isVerified: true,
      };
    }

    if (post.publisherType === "HOST") {
      return {
        name: post.publisher?.name || "میزبان اقامتگاه",
        badge: "میزبان اقامتگاه",
        link: post.publisher?.slug ? `/host/${post.publisher.slug}` : "/temporary-rent",
        logoUrl: post.publisher?.logoUrl || null,
        type: "HOST" as const,
        isVerified: post.publisher?.isVerified ?? false,
      };
    }

    const agency = post.publisher;
    const agencySlugOrId = agency?.slug || agency?.id || post.publisherId;
    return {
      name: agency?.name || "آژانس املاک",
      badge: "آژانس املاک",
      link: agencySlugOrId ? `/agency/showcase/${encodeURIComponent(agencySlugOrId)}` : "/agency",
      logoUrl: agency?.logoUrl || null,
      type: "AGENCY" as const,
      isVerified: agency?.isVerified ?? true,
    };
  }, [post]);

  interface NormalizedMediaItem {
    id: string;
    type: "IMAGE" | "VIDEO" | "DOCUMENT";
    url: string;
    posterUrl: string;
  }

  // Canonical media references directly from post.mediaIds
  const mediaList = useMemo<NormalizedMediaItem[]>(() => {
    if (!post?.mediaIds || post.mediaIds.length === 0) return [];

    return post.mediaIds.map((item, idx) => ({
      id: item.id || `media-${idx}`,
      type: item.type,
      url: getMediaUrl(item),
      posterUrl: getMediaPosterUrl(item),
    }));
  }, [post]);

  // Determine if post is Instagram style or Medium style
  const isInstagramStyle = useMemo(() => {
    if (!post) return false;
    // Explicit condition: multiple media items OR short text without markdown structure
    const hasMultipleMedia = mediaList.length > 1;
    const isShortText = (post.content?.length || 0) < 500 && !post.content?.includes("## ");
    return hasMultipleMedia || (isShortText && !post.summary);
  }, [post, mediaList]);

  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!post) return;

    if (!isLoggedIn) {
      toast.info("برای پسندیدن پست، لطفاً ابتدا وارد حساب کاربری شوید.");
      router.push(`/auth?returnUrl=/posts/${encodeURIComponent(idOrSlug)}`);
      return;
    }

    likeMutation.mutate(post.id);
  };

  const handleDoubleTapMedia = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (post && !post.hasLiked) {
      handleLike();
    }
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: post?.title || "ملک‌تودی",
          text: post?.summary || post?.title,
          url,
        })
        .catch(() => {
          // ignore cancel
        });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("لینک پست در حافظه کپی شد.");
    } else {
      toast.info(url);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const estimatedReadingTime = useMemo(() => {
    if (!post?.content) return 1;
    const wordCount = post.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [post?.content]);

  // ── Loading & Error States ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-slate-600">در حال دریافت محتوای پست...</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-5 shadow-sm" dir="rtl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-brand">پست یافت نشد</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            متأسفانه پست مورد نظر شما وجود ندارد یا از دسترس خارج شده است.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
          >
            تلاش مجدد
          </button>
          <Link
            href="/explore"
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all"
          >
            بازگشت به کاوش
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={observerRef} className="min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 lg:pb-8 space-y-6" dir="rtl">

      {/* ── BREADCRUMB & BACK NAVIGATION ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-brand hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
          aria-label="بازگشت"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {post.category && (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {post.category}
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── INSTAGRAM-STYLE POST DETAIL ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isInstagramStyle ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-w-5xl mx-auto">

          {/* ── Left Column / Media Carousel ─────────────────────────────── */}
          <div className="lg:col-span-7 bg-slate-950 relative flex flex-col justify-center select-none group min-h-[380px] sm:min-h-[500px]">
            <div
              className="relative aspect-square sm:aspect-4/5 w-full overflow-hidden flex items-center justify-center cursor-pointer"
              onDoubleClick={handleDoubleTapMedia}
            >
              {mediaList.length > 0 ? (
                <>
                  {(() => {
                    const currentMedia = mediaList[activeSlide] || mediaList[0];
                    if (currentMedia.type === "VIDEO") {
                      return (
                        <video
                          key={currentMedia.id}
                          src={currentMedia.url}
                          poster={currentMedia.posterUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    return (
                      <img
                        key={currentMedia.id}
                        src={currentMedia.url}
                        alt={post.title || `اسلاید ${activeSlide + 1}`}
                        className="w-full h-full object-cover"
                      />
                    );
                  })()}

                  {/* Double tap heart animation */}
                  {showHeartBurst && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none animate-in fade-in zoom-in duration-300">
                      <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-xl" />
                    </div>
                  )}

                  {/* Slide index badge */}
                  {mediaList.length > 1 && (
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-xs">
                      {toPersianDigits(activeSlide + 1)} / {toPersianDigits(mediaList.length)}
                    </div>
                  )}

                  {/* Left / Right Carousel Controls */}
                  {mediaList.length > 1 && (
                    <>
                      {activeSlide > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlide(activeSlide - 1);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                      {activeSlide < mediaList.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlide(activeSlide + 1);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Dots Indicator */}
                  {mediaList.length > 1 && (
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5">
                      {mediaList.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlide(dotIdx);
                          }}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            dotIdx === activeSlide
                              ? "w-6 bg-primary shadow-xs"
                              : "w-2 bg-white/60 hover:bg-white"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-2">
                  <Layers className="w-12 h-12 text-slate-600" />
                  <p className="text-xs font-bold text-slate-400">تصویری برای این پست ثبت نشده است.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column / Post Details & Interactions ───────────────── */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 bg-white border-t lg:border-t-0 lg:border-r border-slate-100 space-y-4">

            {/* Publisher Header */}
            {publisherInfo && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Link
                  href={publisherInfo.link}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <div className="relative w-11 h-11 rounded-full p-0.5 border border-primary bg-primary/10 shrink-0 overflow-hidden">
                    {publisherInfo.logoUrl ? (
                      <img
                        src={getMediaUrl(publisherInfo.logoUrl)}
                        alt={publisherInfo.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
                        {publisherInfo.type === "PLATFORM" ? (
                          <ShieldCheck className="w-5 h-5 text-brand" />
                        ) : publisherInfo.type === "HOST" ? (
                          <Hotel className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-brand group-hover:text-primary transition-colors truncate">
                        {publisherInfo.name}
                      </span>
                      {publisherInfo.isVerified && (
                        <Verified className="w-4 h-4 text-primary fill-primary/10 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {publisherInfo.badge}
                    </span>
                  </div>
                </Link>

                <Link
                  href={publisherInfo.link}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shrink-0"
                >
                  مشاهده پروفایل
                </Link>
              </div>
            )}

            {/* Caption & Content Body */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
              <h1 className="text-base font-black text-brand leading-snug">
                {post.title}
              </h1>

              <div className="text-xs sm:text-sm text-slate-700 leading-loose whitespace-pre-wrap select-text">
                {post.content}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all",
                      post.hasLiked
                        ? "bg-red-50 text-red-600 border border-red-200 shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-transform active:scale-125",
                        post.hasLiked ? "fill-red-600 text-red-600" : ""
                      )}
                    />
                    <span>{toPersianDigits(post.likeCount || 0)}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>اشتراک‌گذاری</span>
                  </button>
                </div>

                {/* View Counter */}
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                  <Eye className="w-4 h-4" />
                  <span>{toPersianDigits(post.viewCount || 0)} بازدید</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* ── MEDIUM-STYLE ARTICLE DETAIL ─────────────────────────────────── */
        /* ═══════════════════════════════════════════════════════════════════ */
        <article className="max-w-3xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">

          {/* Article Header */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand leading-tight tracking-normal">
              {post.title}
            </h1>

            {post.summary && (
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border-r-4 border-primary">
                {post.summary}
              </p>
            )}

            {/* Author / Publisher Bar */}
            {publisherInfo && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <Link
                  href={publisherInfo.link}
                  className="flex items-center gap-3 group"
                >
                  <div className="relative w-12 h-12 rounded-full p-0.5 border border-primary bg-primary/10 overflow-hidden shrink-0">
                    {publisherInfo.logoUrl ? (
                      <img
                        src={getMediaUrl(publisherInfo.logoUrl)}
                        alt={publisherInfo.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
                        {publisherInfo.type === "PLATFORM" ? (
                          <ShieldCheck className="w-5 h-5 text-brand" />
                        ) : publisherInfo.type === "HOST" ? (
                          <Hotel className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-brand group-hover:text-primary transition-colors">
                        {publisherInfo.name}
                      </span>
                      {publisherInfo.isVerified && (
                        <Verified className="w-4 h-4 text-primary fill-primary/10 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {publisherInfo.badge}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(post.createdAt)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{toPersianDigits(estimatedReadingTime)} دقیقه مطالعه</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hero Featured Media (Image / Video / Carousel) */}
          {mediaList.length > 0 && (
            <div className="space-y-3">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-xs flex items-center justify-center">
                {(() => {
                  const currentMedia = mediaList[activeSlide] || mediaList[0];
                  if (currentMedia.type === "VIDEO") {
                    return (
                      <video
                        key={currentMedia.id}
                        src={currentMedia.url}
                        poster={currentMedia.posterUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  return (
                    <img
                      key={currentMedia.id}
                      src={currentMedia.url}
                      alt={post.title || `تصویر ${activeSlide + 1}`}
                      className="w-full h-full object-cover"
                    />
                  );
                })()}

                {/* Slide indicator & nav in Medium style if multiple media */}
                {mediaList.length > 1 && (
                  <>
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-xs">
                      {toPersianDigits(activeSlide + 1)} / {toPersianDigits(mediaList.length)}
                    </div>
                    {activeSlide > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveSlide(activeSlide - 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                    {activeSlide < mediaList.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveSlide(activeSlide + 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Dots / Thumbnails row if multiple items */}
              {mediaList.length > 1 && (
                <div className="flex items-center justify-center gap-2 py-1">
                  {mediaList.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={cn(
                        "relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-900",
                        idx === activeSlide
                          ? "border-primary ring-2 ring-primary/20 scale-105"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={item.type === "VIDEO" ? item.posterUrl : item.url}
                        alt={`بند انگشتی ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {item.type === "VIDEO" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="w-3 h-3 text-white text-[10px]">▶</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rich Markdown Article Content */}
          <div className="py-2">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Article Footer & Interactions */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Like / Clap button */}
              <button
                type="button"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all",
                  post.hasLiked
                    ? "bg-red-50 text-red-600 border border-red-200 shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                )}
              >
                <Heart
                  className={cn(
                    "w-4 h-4 transition-transform active:scale-125",
                    post.hasLiked ? "fill-red-600 text-red-600" : ""
                  )}
                />
                <span>پسندیدم ({toPersianDigits(post.likeCount || 0)})</span>
              </button>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>اشتراک‌گذاری مقاله</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <Eye className="w-4 h-4" />
              <span>{toPersianDigits(post.viewCount || 0)} بازدید ثبت شده</span>
            </div>
          </div>

          {/* Author Bio Box */}
          {publisherInfo && (
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-right">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                  {publisherInfo.logoUrl ? (
                    <img
                      src={getMediaUrl(publisherInfo.logoUrl)}
                      alt={publisherInfo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-brand" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-brand">تولید شده توسط {publisherInfo.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">برای مشاهده آگهی‌ها و مقالات بیشتر به صفحه اختصاصی ناشر مراجعه فرمایید.</p>
                </div>
              </div>

              <Link
                href={publisherInfo.link}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all shrink-0 shadow-xs"
              >
                مشاهده صفحه ناشر
              </Link>
            </div>
          )}

        </article>
      )}

    </div>
  );
}
