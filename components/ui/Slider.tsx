"use client";

import { cn } from "@/lib/utils";
import { Children, ReactNode, useRef, useState } from "react";
import { FreeMode, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface SliderProps {
    children: ReactNode | ReactNode[];
    slidesPerView?: number | "auto";
    spaceBetween?: number;
    freeMode?: boolean;
    showArrows?: boolean;
    breakpoints?: {
        [width: number]: {
            slidesPerView: number;
            spaceBetween?: number;
        };
    };
    className?: string;
}

export function Slider({
    children,
    slidesPerView = "auto",
    spaceBetween = 16,
    freeMode = true,
    showArrows = true,
    breakpoints,
    className,
}: SliderProps) {
    const swiperRef = useRef<SwiperType | null>(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    return (
        <div className="relative group/slider">
            <Swiper
                onBeforeInit={(swiper) => {
                    swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => {
                    setIsBeginning(swiper.isBeginning);
                    setIsEnd(swiper.isEnd);
                }}
                slidesPerView={slidesPerView}
                spaceBetween={spaceBetween}
                freeMode={freeMode}
                modules={[FreeMode, Navigation, Pagination]}
                breakpoints={breakpoints}
                className={cn("h-full", className)}
            >
                {Children.map(children, (child, index) => (
                    <SwiperSlide key={index} className="w-auto! h-auto!">
                        {child}
                    </SwiperSlide>
                ))}
            </Swiper>

            {showArrows && (
                <>
                    <button
                        type="button"
                        aria-label="اسلاید قبلی"
                        onClick={() => swiperRef.current?.slidePrev()}
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-primary hover:bg-white hover:scale-105 transition-all opacity-0 group-hover/slider:opacity-100 disabled:opacity-0 pointer-events-auto cursor-pointer",
                            isBeginning && "hidden"
                        )}
                        disabled={isBeginning}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="اسلاید بعدی"
                        onClick={() => swiperRef.current?.slideNext()}
                        className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-primary hover:bg-white hover:scale-105 transition-all opacity-0 group-hover/slider:opacity-100 disabled:opacity-0 pointer-events-auto cursor-pointer",
                            isEnd && "hidden"
                        )}
                        disabled={isEnd}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    );
}

export { SwiperSlide };
