"use client";

import { cn, toPersianDigits } from "@/lib/utils";
import { AdDetail } from "@/types/api/ads.types";
import {
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    Heart,
    MessageSquare,
    Pause,
    Phone,
    Share2,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface AdStoryMediaItem {
    id: string;
    url: string;
    posterUrl?: string;
    isVideo: boolean;
}

export interface AdStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaItems: AdStoryMediaItem[];
    initialIndex?: number;
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

const DEFAULT_STORY_DURATION = 5000; // 5 seconds per image

function AdStoryModalInner({
    onClose,
    mediaItems,
    initialIndex = 0,
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
}: Omit<AdStoryModalProps, "isOpen">) {
    const totalSlides = mediaItems.length;
    const [currentIndex, setCurrentIndex] = useState(() =>
        Math.min(Math.max(0, initialIndex), Math.max(0, totalSlides - 1))
    );
    const [progress, setProgress] = useState(0); // 0 to 100
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showHeartBurst, setShowHeartBurst] = useState(false);
    const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

    // References
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchStartX = useRef<number | null>(null);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isHoldingRef = useRef(false);

    const currentMedia = mediaItems[currentIndex] || mediaItems[0];

    // Lock body scroll when modal is mounted
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // Navigation handlers
    const handleNext = useCallback(() => {
        if (currentIndex < totalSlides - 1) {
            setCurrentIndex((prev) => prev + 1);
            setProgress(0);
            lastTimeRef.current = null;
        } else {
            // End of story reached: close modal
            onClose();
        }
    }, [currentIndex, totalSlides, onClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setProgress(0);
            lastTimeRef.current = null;
        } else {
            // At first slide, restart current slide
            setProgress(0);
            lastTimeRef.current = null;
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
        }
    }, [currentIndex]);

    // Progress animation loop using requestAnimationFrame
    useEffect(() => {
        if (totalSlides === 0) return;

        let active = true;

        const updateProgress = (timestamp: number) => {
            if (!active) return;

            if (isPaused) {
                lastTimeRef.current = timestamp;
                animationFrameRef.current = requestAnimationFrame(updateProgress);
                return;
            }

            // If it's a video, sync progress with video playback
            if (currentMedia?.isVideo && videoRef.current) {
                const video = videoRef.current;
                if (!video.paused && video.duration) {
                    const currentPct = (video.currentTime / video.duration) * 100;
                    setProgress(Math.min(100, Math.max(0, currentPct)));
                    if (video.ended || currentPct >= 99.5) {
                        handleNext();
                        return;
                    }
                }
            } else {
                // Image timer
                if (lastTimeRef.current === null) {
                    lastTimeRef.current = timestamp;
                }
                const elapsed = timestamp - lastTimeRef.current;
                lastTimeRef.current = timestamp;

                setProgress((prev) => {
                    const next = prev + (elapsed / DEFAULT_STORY_DURATION) * 100;
                    if (next >= 100) {
                        handleNext();
                        return 0;
                    }
                    return next;
                });
            }

            animationFrameRef.current = requestAnimationFrame(updateProgress);
        };

        animationFrameRef.current = requestAnimationFrame(updateProgress);

        return () => {
            active = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPaused, currentMedia, handleNext, totalSlides]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                // In RTL layout, Left arrow moves forward to Next slide
                handleNext();
            } else if (e.key === "ArrowRight") {
                // Right arrow moves back to Previous slide
                handlePrev();
            } else if (e.key === " ") {
                e.preventDefault();
                setIsPaused((p) => !p);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev, onClose]);

    // Press & Hold to pause
    const handleHoldStart = () => {
        holdTimerRef.current = setTimeout(() => {
            isHoldingRef.current = true;
            setIsPaused(true);
            if (videoRef.current && !videoRef.current.paused) {
                videoRef.current.pause();
            }
        }, 150);
    };

    const handleHoldEnd = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
        }
        if (isHoldingRef.current) {
            isHoldingRef.current = false;
            setIsPaused(false);
            if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
            }
        }
    };

    // Double tap / click to like
    const handleDoubleTap = () => {
        setShowHeartBurst(true);
        setTimeout(() => setShowHeartBurst(false), 900);
        if (onToggleSave && !saved) {
            onToggleSave();
        }
    };

    // Touch swipe handling
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        handleHoldStart();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        handleHoldEnd();

        if (touchStartX.current === null || touchStartY.current === null) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const deltaY = touch.clientY - touchStartY.current;

        touchStartX.current = null;
        touchStartY.current = null;

        // Swipe down to dismiss
        if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
            onClose();
            return;
        }

        // Swipe left / right
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                // Swiped towards left -> Next in RTL
                handleNext();
            } else {
                // Swiped towards right -> Prev in RTL
                handlePrev();
            }
        }
    };

    // Tap zone handler (click on left = next, click on right = prev in RTL)
    const handleTapZone = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isHoldingRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        // Left 35% advances to Next in RTL
        if (clickX < width * 0.35) {
            handleNext();
        } else if (clickX > width * 0.65) {
            // Right 35% goes to Previous
            handlePrev();
        } else {
            // Center tap toggles pause
            setIsPaused((p) => !p);
        }
    };

    if (!currentMedia) return null;

    const publisher = ad.publisher;
    const publisherName = publisher?.name || ad.title;
    const publisherAvatar = publisher?.avatar;
    const isVideo = currentMedia.isVideo;
    const locationText = [ad.location?.city?.name, ad.location?.neighbourhood?.name]
        .filter(Boolean)
        .join("، ");

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="استوری آگهی"
            className="fixed inset-0 z-50 bg-black/95 sm:bg-black/90 backdrop-blur-2xl flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-200"
            dir="rtl"
        >
            {/* Desktop Left/Right Navigation Chevrons outside frame */}
            <button
                type="button"
                onClick={handlePrev}
                aria-label="استوری قبلی"
                className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
            <button
                type="button"
                onClick={handleNext}
                aria-label="استوری بعدی"
                className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Desktop Top Close Button outside frame */}
            <button
                type="button"
                onClick={onClose}
                aria-label="بستن استوری"
                className="hidden sm:flex absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/15 items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-lg"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Smartphone Story Container */}
            <div
                className="relative w-full h-full sm:max-w-[420px] sm:h-[92vh] sm:max-h-[850px] sm:rounded-3xl sm:border sm:border-white/15 sm:shadow-2xl overflow-hidden bg-black flex flex-col justify-between"
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* ── AMBIENT BLURRED BACKDROP (Instagram Effect) ── */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={isVideo ? (currentMedia.posterUrl || currentMedia.url) : currentMedia.url}
                        alt=""
                        className="w-full h-full object-cover blur-3xl opacity-35 scale-125 transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
                </div>

                {/* ── TOP BARS & STORY HEADER ── */}
                <div className="relative z-30 pt-3 px-3 sm:px-4 space-y-2 pointer-events-auto">
                    {/* Segmented Progress Bars */}
                    <div className="flex items-center gap-1.5 w-full">
                        {mediaItems.map((item, idx) => {
                            let width = "0%";
                            if (idx < currentIndex) {
                                width = "100%";
                            } else if (idx === currentIndex) {
                                width = `${progress}%`;
                            }

                            return (
                                <div
                                    key={item.id || idx}
                                    className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-xs transition-all"
                                >
                                    <div
                                        className="h-full bg-white rounded-full transition-[width] ease-linear duration-75"
                                        style={{ width }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Header: Publisher info & Controls */}
                    <div className="flex items-center justify-between pt-1">
                        {/* Right: Publisher Avatar & Details */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            {/* Instagram Gradient Ring Avatar */}
                            <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 shadow-md">
                                <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
                                    {publisherAvatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={publisherAvatar}
                                            alt={publisherName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <Building2 className="w-4 h-4 text-white" />
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 text-white">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs sm:text-sm font-black truncate max-w-[170px] sm:max-w-[200px]">
                                        {publisherName}
                                    </p>
                                    {publisher?.isVerified && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/70">
                                    <span>{subcategoryTitle || categoryTitle || "آگهی ملک"}</span>
                                    <span>•</span>
                                    <span>
                                        {toPersianDigits(currentIndex + 1)} از {toPersianDigits(totalSlides)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Left: Video mute & Close button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {isVideo && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMuted((prev) => {
                                            const next = !prev;
                                            if (videoRef.current) {
                                                videoRef.current.muted = next;
                                            }
                                            return next;
                                        });
                                    }}
                                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                                    aria-label={isMuted ? "روشن کردن صدا" : "قطع صدا"}
                                >
                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                            )}

                            {isPaused && (
                                <div className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] text-white/90 font-bold flex items-center gap-1 animate-pulse">
                                    <Pause className="w-3 h-3 fill-current" />
                                    <span>توقف</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                                aria-label="بستن"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CENTER MEDIA CONTAINER ── */}
                <div
                    className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer select-none"
                    onClick={handleTapZone}
                    onDoubleClick={handleDoubleTap}
                >
                    {isVideo ? (
                        <video
                            ref={videoRef}
                            key={currentMedia.id}
                            src={currentMedia.url}
                            poster={currentMedia.posterUrl}
                            muted={isMuted}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain pointer-events-none"
                        />
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            key={currentMedia.id}
                            src={imageErrorMap[currentMedia.id] ? "/property-placeholder.svg" : currentMedia.url}
                            alt={ad.title}
                            draggable={false}
                            className="w-full h-full object-contain pointer-events-none transition-all duration-300"
                            onError={() => {
                                setImageErrorMap((prev) => ({ ...prev, [currentMedia.id]: true }));
                            }}
                        />
                    )}

                    {/* Double-tap Heart Burst Animation */}
                    {showHeartBurst && (
                        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                            <div className="animate-in zoom-in-50 fade-in duration-300 flex items-center justify-center">
                                <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* Subtle Tap Area Cue Indicators (Hover on Desktop) */}
                    <div className="absolute inset-y-0 left-0 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-start pl-2 transition-opacity pointer-events-none">
                        <span className="p-1 rounded-full bg-black/30 backdrop-blur-xs text-white/50">
                            <ChevronLeft className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-end pr-2 transition-opacity pointer-events-none">
                        <span className="p-1 rounded-full bg-black/30 backdrop-blur-xs text-white/50">
                            <ChevronRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>

                {/* ── BOTTOM DRAWER / STORY FOOTER ── */}
                <div className="relative z-30 p-4 pb-6 sm:pb-5 bg-gradient-to-t from-black via-black/80 to-transparent text-white space-y-3 pointer-events-auto">
                    {/* Property Quick Info */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base font-black truncate text-white drop-shadow">
                                {ad.title}
                            </h2>
                            {ad.isDecorativeImages && (
                                <span className="text-[10px] font-bold bg-amber-500/80 text-white px-2 py-0.5 rounded-full shrink-0">
                                    تزئینی
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <div className="text-amber-300 font-black text-sm sm:text-base drop-shadow">
                                {priceMain || "توافقی"}
                                {priceSub && <span className="text-xs text-white/80 font-normal mr-2">({priceSub})</span>}
                            </div>
                            {locationText && (
                                <span className="text-[11px] text-white/70 truncate max-w-[150px]">
                                    {locationText}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 pt-1">
                        {/* Call Button */}
                        {onContactClick && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onContactClick();
                                }}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 transition-all active:scale-95 cursor-pointer"
                            >
                                <Phone className="w-4 h-4" />
                                <span>تماس با مالک</span>
                            </button>
                        )}

                        {/* Chat Button */}
                        {onChat && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChat();
                                }}
                                className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/15 transition-all active:scale-95 cursor-pointer"
                                title="ارسال پیام"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline">گفتگو</span>
                            </button>
                        )}

                        {/* Save / Bookmark Button */}
                        {onToggleSave && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave();
                                }}
                                className={cn(
                                    "p-2.5 rounded-xl backdrop-blur-md transition-all active:scale-90 border cursor-pointer",
                                    saved
                                        ? "bg-rose-500 text-white border-rose-400"
                                        : "bg-white/15 hover:bg-white/25 text-white border-white/15"
                                )}
                                title={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
                                aria-label="نشان کردن"
                            >
                                <Heart className={cn("w-4 h-4", saved && "fill-current")} />
                            </button>
                        )}

                        {/* Share Button */}
                        {onShare && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare();
                                }}
                                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/15 transition-all active:scale-90 cursor-pointer"
                                title="اشتراک‌گذاری"
                                aria-label="اشتراک‌گذاری"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AdStoryModal(props: AdStoryModalProps) {
    if (!props.isOpen) return null;
    return <AdStoryModalInner key={`${props.isOpen}-${props.initialIndex ?? 0}`} {...props} />;
}
