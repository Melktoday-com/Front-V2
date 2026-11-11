"use client";

import { cn, toPersianDigits } from "@/lib/utils";
import { AdDetail } from "@/types/api/ads.types";
import {
    Camera,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Play,
    Sparkles,
} from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { AdStoryMediaItem, AdStoryModal } from "./AdStoryModal";

export interface AdGallerySliderProps {
    mediaItems: AdStoryMediaItem[];
    ad: AdDetail;
    categoryTitle?: string;
    subcategoryTitle?: string;
    priceMain?: string;
    priceSub?: string | null;
    saved?: boolean;
    onToggleSave?: () => void;
    onChat?: () => void;
    onContactClick?: () => void;
    onShare?: () => void;
}

export function AdGallerySlider({
    mediaItems,
    ad,
    categoryTitle,
    subcategoryTitle,
    priceMain,
    priceSub,
    saved = false,
    onToggleSave,
    onChat,
    onContactClick,
    onShare,
}: AdGallerySliderProps) {
    const swiperRef = useRef<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(mediaItems.length <= 1);
    const [isStoryOpen, setIsStoryOpen] = useState(false);
    const [storyStartIndex, setStoryStartIndex] = useState(0);
    const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

    const totalSlides = mediaItems.length;

    const handleOpenStory = (index: number) => {
        setStoryStartIndex(index);
        setIsStoryOpen(true);
    };

    const handleThumbnailClick = (index: number) => {
        setActiveIndex(index);
        if (swiperRef.current) {
            swiperRef.current.slideTo(index);
        }
    };

    return (
        <section className="space-y-3" aria-label="گالری تصاویر آگهی">
            {/* ── MAIN SWIPER CONTAINER ── */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] lg:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-950 shadow-md group border border-border-subtle">
                <Swiper
                    dir="rtl"
                    slidesPerView={1}
                    spaceBetween={0}
                    threshold={5}
                    watchOverflow={true}
                    modules={[Navigation, Pagination, Keyboard, A11y]}
                    keyboard={{ enabled: true }}
                    onBeforeInit={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                    }}
                    onSlideChange={(swiper) => {
                        setActiveIndex(swiper.activeIndex);
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                    }}
                    className="w-full h-full select-none"
                >
                    {mediaItems.map((media, idx) => (
                        <SwiperSlide key={media.id || idx} className="w-full h-full">
                            <div
                                onClick={() => handleOpenStory(idx)}
                                className="relative w-full h-full cursor-pointer overflow-hidden bg-slate-950 flex items-center justify-center group/slide"
                                title="برای مشاهده استوری تمام‌صفحه کلیک کنید"
                            >
                                {media.isVideo ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {media.posterUrl && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <Image
                                                src={media.posterUrl}
                                                alt={ad.title}
                                                className="w-full h-full object-cover opacity-85 group-hover/slide:scale-102 transition-transform duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl group-hover/slide:scale-110 transition-transform">
                                                <Play className="w-8 h-8 fill-white ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <Image
                                        src={imageErrorMap[media.id] ? "/property-placeholder.svg" : media.url}
                                        alt={`${ad.title} - تصویر ${idx + 1}`}
                                        className="w-full h-full object-cover group-hover/slide:scale-102 transition-transform duration-500"
                                        onError={() => {
                                            setImageErrorMap((prev) => ({ ...prev, [media.id]: true }));
                                        }}
                                    />
                                )}

                                {/* Subtle Dark Gradient at bottom for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>




                {/* ── TOP LEFT: INSTAGRAM STORY TRIGGER BUTTON ── */}
                <div className="absolute top-4 left-4 z-20">
                    <button
                        type="button"
                        onClick={() => handleOpenStory(activeIndex)}
                        className="group/story p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg hover:shadow-rose-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="مشاهده به صورت استوری اینستاگرام"
                    >
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold transition-colors">

                            <Maximize2 className="w-3 h-3 text-white/80 mr-0.5" />
                        </div>
                    </button>
                </div>

                {/* ── BOTTOM LEFT: SLIDE COUNTER BADGE ── */}
                <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/15 shadow-md">
                        <Camera className="w-3.5 h-3.5 text-white/80" />
                        <span>
                            {toPersianDigits(activeIndex + 1)} / {toPersianDigits(totalSlides)}
                        </span>
                    </div>
                </div>

                {/* ── BOTTOM RIGHT: STORY CLICK HINT ── */}
                <div className="hidden sm:flex absolute bottom-4 right-4 z-20 pointer-events-none">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs text-[11px] text-white/80 border border-white/10">
                        <span>برای مشاهده استوری کلیک کنید</span>
                    </div>
                </div>

                {/* ── NAVIGATION ARROWS (Chevrons) ── */}
                {totalSlides > 1 && (
                    <>
                        {/* Next in RTL = Left arrow */}
                        <button
                            type="button"
                            onClick={() => swiperRef.current?.slideNext()}
                            aria-label="عکس بعدی"
                            className={cn(
                                "absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-md text-white border border-white/15 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg active:scale-90",
                                isEnd && "opacity-0! pointer-events-none"
                            )}
                            disabled={isEnd}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Prev in RTL = Right arrow */}
                        <button
                            type="button"
                            onClick={() => swiperRef.current?.slidePrev()}
                            aria-label="عکس قبلی"
                            className={cn(
                                "absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-md text-white border border-white/15 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg active:scale-90",
                                isBeginning && "opacity-0! pointer-events-none"
                            )}
                            disabled={isBeginning}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* ── THUMBNAILS CAROUSEL ── */}
            {totalSlides > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                    {mediaItems.map((media, idx) => (
                        <button
                            key={media.id || idx}
                            type="button"
                            onClick={() => handleThumbnailClick(idx)}
                            aria-label={`انتخاب اسلاید ${idx + 1}`}
                            className={cn(
                                "relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer focus:outline-hidden",
                                activeIndex === idx
                                    ? "border-primary scale-105 shadow-md ring-2 ring-primary/30 opacity-100"
                                    : "border-transparent opacity-60 hover:opacity-100 hover:scale-102"
                            )}
                        >
                            {media.isVideo ? (
                                <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                                    {media.posterUrl ? (
                                        <Image
                                            src={media.posterUrl}
                                            alt={`ویدیو ${idx + 1}`}
                                            fill
                                            className="object-cover opacity-80"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800" />
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center relative z-10">
                                        <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5 drop-shadow" />
                                    </div>
                                    <span className="absolute bottom-1 right-1 text-[9px] text-white bg-black/70 px-1 rounded z-10 font-bold">
                                        ویدیو
                                    </span>
                                </div>
                            ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <Image
                                    src={imageErrorMap[media.id] ? "/property-placeholder.svg" : media.url}
                                    alt={`بندانگشتی ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={() => {
                                        setImageErrorMap((prev) => ({ ...prev, [media.id]: true }));
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ── INSTAGRAM STORY MODAL ── */}
            <AdStoryModal
                isOpen={isStoryOpen}
                onClose={() => setIsStoryOpen(false)}
                mediaItems={mediaItems}
                initialIndex={storyStartIndex}
                ad={ad}
                categoryTitle={categoryTitle}
                subcategoryTitle={subcategoryTitle}
                priceMain={priceMain}
                priceSub={priceSub}
                saved={saved}
                onToggleSave={onToggleSave}
                onChat={onChat}
                onContactClick={onContactClick}
                onShare={onShare}
            />
        </section>
    );
}
