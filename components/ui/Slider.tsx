"use client";

import { ReactNode } from "react";
import { FreeMode, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

interface SliderProps {
    children: ReactNode[];
    slidesPerView?: number | "auto";
    spaceBetween?: number;
    freeMode?: boolean;
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
    breakpoints,
    className,
}: SliderProps) {
    return (
        <Swiper
            slidesPerView={slidesPerView}
            spaceBetween={spaceBetween}
            freeMode={freeMode}
            modules={[FreeMode, Pagination]}
            breakpoints={breakpoints}
            className={className}
        >
            {children.map((child, index) => (
                <SwiperSlide key={index} className="w-auto!">
                    {child}
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export { SwiperSlide };
