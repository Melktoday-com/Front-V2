"use client";

import { usePostViewObserver } from "@/hooks/usePostViewObserver";
import { getMediaPosterUrl, getMediaUrl, toPersianDigits } from "@/lib/utils";
import { PUBLISHER_TYPES, UnifiedPost } from "@/types/api/post.types";
import {
  BookOpen,
  Building2,
  Eye,
  Heart,
  Hotel,
  Layers,
  Play,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo } from "react";
import { isArticlePost } from "./ExploreFeedCard";

interface ExploreGridCardProps {
  post: UnifiedPost;
  onSelect: (postId: string) => void;
  onLike?: (e: React.MouseEvent, postId: string) => void;
}

export function ExploreGridCard({ post, onSelect }: ExploreGridCardProps) {
  const observerRef = usePostViewObserver(post.id);

  // Cover image / poster
  const firstMedia = post.mediaIds?.[0];
  const coverUrl = useMemo(() => {
    return firstMedia ? getMediaPosterUrl(firstMedia) : "/property-placeholder.svg";
  }, [firstMedia]);

  // Media characteristics
  const mediaCount = post.mediaIds?.length || 0;
  const isMultiImage = mediaCount > 1;
  const isVideo = firstMedia?.type === "VIDEO" || post.mediaIds?.some((m) => m.type === "VIDEO");
  const isArticle = isArticlePost(post);

  // Publisher info
  const publisher = post.publisher || post.agency;
  const publisherName =
    post.publisherType === PUBLISHER_TYPES.PLATFORM
      ? publisher?.name || "ملک‌تودی"
      : publisher?.name || (post.publisherType === PUBLISHER_TYPES.HOST ? "میزبان" : "آژانس املاک");
  const publisherLogo = publisher?.logoUrl || publisher?.avatarUrl;

  return (
    <article
      ref={observerRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(post.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(post.id);
        }
      }}
      className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-border-subtle/80 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer select-none text-right focus:outline-hidden focus:ring-2 focus:ring-primary/50"
      aria-label={post.title}
    >
      {/* ── Main Cover Image ─────────────────────────────────────────── */}
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

      {/* ── Top-Left Badges (Video, Multi-Image, Article Indicator) ──── */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
        {isVideo && (
          <div
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs"
            title="ویدئو"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        )}
        {isMultiImage && (
          <div
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs"
            title={`${toPersianDigits(mediaCount)} اسلاید`}
          >
            <Layers className="w-3.5 h-3.5" />
          </div>
        )}
        {isArticle && (
          <div
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white shadow-xs"
            title="مقاله"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* ── Hover / Focus Overlay (Instagram Explore style) ──────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-4 text-white z-20">
        {/* Publisher at Top */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 min-w-0">
          {publisherLogo ? (
            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/30">
              <Image
                src={getMediaUrl(publisherLogo)}
                alt={publisherName}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              {post.publisherType === PUBLISHER_TYPES.PLATFORM ? (
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              ) : post.publisherType === PUBLISHER_TYPES.HOST ? (
                <Hotel className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
              )}
            </div>
          )}
          <span className="truncate text-[11px] sm:text-xs font-bold drop-shadow-xs">
            {publisherName}
          </span>
        </div>

        {/* Title and Stats at Bottom */}
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-black line-clamp-2 leading-snug drop-shadow-sm text-slate-100">
            {post.title}
          </p>

          <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
              <span>{toPersianDigits(post.likeCount || 0)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-300" />
              <span>{toPersianDigits(post.viewCount || 0)}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
