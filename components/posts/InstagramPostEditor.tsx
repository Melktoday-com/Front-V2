"use client";

import React, { useState } from "react";
import MediaGalleryUpload from "@/components/MediaGalleryUpload";
import { getMediaUrl, toPersianDigits, cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Tag,
  Eye,
  CheckCircle2,
  Building2,
  Hotel,
  ShieldCheck,
  Verified,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { PublisherType } from "@/types/api/post.types";
import type { MediaReference } from "@/types/api/media.types";

interface PublisherInfo {
  type: PublisherType;
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface InstagramPostEditorProps {
  publisher: PublisherInfo;
  title: string;
  setTitle: (v: string) => void;
  caption: string;
  setCaption: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  mediaUrls: (MediaReference | string)[];
  setMediaUrls: (v: MediaReference[]) => void;
  locationTag?: string;
  setLocationTag?: (v: string) => void;
}

const POPULAR_HASHTAGS = [
  "#ملک_لوکس",
  "#رهن_و_اجاره",
  "#خرید_آپارتمان",
  "#سرمایه_گذاری",
  "#ویلا_شمال",
  "#تحلیل_بازار",
  "#فرصت_استثنایی",
  "#پنت_هاوس",
  "#نکات_حقوقی_ملک",
  "#اقامتگاه_بومگردی",
];

const INSTAGRAM_CATEGORIES = [
  "معرفی ملک ویژه",
  "تور ویدیویی و تصویری",
  "فرصت سرمایه‌گذاری فوری",
  "نکات کلیدی و کاربردی",
  "اخبار و تحولات ملکی",
  "تجربه اقامت و میزبانی",
];

export function InstagramPostEditor({
  publisher,
  title,
  setTitle,
  caption,
  setCaption,
  category,
  setCategory,
  mediaUrls,
  setMediaUrls,
  locationTag = "",
  setLocationTag,
}: InstagramPostEditorProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const addHashtag = (tag: string) => {
    if (caption.includes(tag)) return;
    const separator = caption.trim().length > 0 ? " " : "";
    setCaption(`${caption}${separator}${tag}`);
  };

  const handleNextSlide = () => {
    if (activeSlide < mediaUrls.length - 1) {
      setActiveSlide(activeSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT / MAIN: FORM INPUTS ─────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-6">
        {/* Header Alert / Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              قالب تصویری و چند اسلایدی (مشابه اینستاگرام)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              تصاویر باکیفیت از ملک یا نکات کلیدی را در قالب اسلایدر آپلود کرده و همراه با کپشن و هشتگ‌های جذاب به اشتراک بگذارید.
            </p>
          </div>
        </div>

        {/* Media Gallery Upload */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>گالری تصاویر اسلایدها (چند تصویری)</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-xs font-bold text-slate-400">
              {toPersianDigits(mediaUrls.length)} از ۱۰ تصویر
            </span>
          </div>

          <MediaGalleryUpload
            value={mediaUrls}
            onChange={(items) => {
              setMediaUrls(items);
              if (activeSlide >= items.length) {
                setActiveSlide(Math.max(0, items.length - 1));
              }
            }}
            label=""
            helperText="عکس‌ها و ویدئوهای خود را آپلود کنید. اولین رسانه به عنوان کاور اصلی اسلایدر نمایش داده می‌شود."
            maxFiles={10}
            allowVideos={true}
          />
        </div>

        {/* Post Headline / Title */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>تیتر کوتاه / عنوان پست</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: معرفی پنت‌هاوس ۲۵۰ متری فرمانیه با دید ابدی"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category & Location Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>دسته‌بندی موضوعی</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all"
              >
                {INSTAGRAM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {setLocationTag && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>تگ موقعیت / محله (اختیاری)</span>
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: زعفرانیه، تهران"
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Caption / Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>متن کپشن پست</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {toPersianDigits(caption.length)} کاراکتر
              </span>
            </div>
            <textarea
              required
              rows={6}
              placeholder="توضیحات جذاب درباره ملک، مشخصات، قیمت، امکانات یا تحلیل سریع خود را در اینجا بنویسید..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all placeholder:text-slate-400 leading-relaxed resize-none"
            />
          </div>

          {/* Quick Hashtags */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block">
              پیشنهاد هشتگ‌های پرکاربرد (کلیک برای افزودن به کپشن):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_HASHTAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addHashtag(tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold transition-all dir-ltr",
                    caption.includes(tag)
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: LIVE INSTAGRAM PREVIEW MOCKUP ─────────────────────── */}
      <div className="lg:col-span-5 sticky top-24 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-primary" />
            <span>پیش‌نمایش زنده پست (اینستاگرامی)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">مشاهده در موبایل</span>
        </div>

        {/* Phone Frame */}
        <div className="bg-white rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden max-w-sm mx-auto">
          {/* Mockup Status Bar */}
          <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-[11px] font-bold">
            <span>20:25</span>
            <div className="w-16 h-4 bg-slate-800 rounded-full" />
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-5 h-2.5 bg-white rounded-xs" />
            </div>
          </div>

          {/* Mockup Post Header */}
          <div className="p-3.5 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full p-0.5 border border-primary bg-primary/10">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                  {publisher.avatarUrl ? (
                    <Image
                      src={getMediaUrl(publisher.avatarUrl)}
                      alt={publisher.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-600 font-black text-xs">
                      {publisher.type === "PLATFORM" && <ShieldCheck className="w-4 h-4 text-primary" />}
                      {publisher.type === "HOST" && <Hotel className="w-4 h-4 text-emerald-600" />}
                      {publisher.type === "AGENCY" && <Building2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-slate-900 line-clamp-1">
                    {publisher.name || "نام صفحه ناشر"}
                  </span>
                  {publisher.isVerified && (
                    <Verified className="w-3.5 h-3.5 text-primary fill-primary/10 shrink-0" />
                  )}
                </div>
                {locationTag ? (
                  <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    <span>{locationTag}</span>
                  </p>
                ) : (
                  <span className="text-[10px] text-primary font-bold">
                    {category || "ملک تودی"}
                  </span>
                )}
              </div>
            </div>
            <div className="text-slate-400 text-lg font-bold tracking-widest px-1">•••</div>
          </div>

          {/* Media Carousel Preview */}
          <div className="relative aspect-square w-full bg-slate-900 overflow-hidden group">
            {mediaUrls.length > 0 ? (
              <>
                {(() => {
                  const currentItem = mediaUrls[activeSlide] || mediaUrls[0];
                  const currentUrl = getMediaUrl(currentItem);
                  const isVideo =
                    (typeof currentItem === "object" && currentItem?.type === "VIDEO") ||
                    (typeof currentItem === "string" && /\.(mp4|mov|webm)$/i.test(currentItem));

                  return (
                    <>
                      {isVideo ? (
                        <video
                          src={currentUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover select-none"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={currentUrl}
                          alt={`اسلاید ${activeSlide + 1}`}
                          className="w-full h-full object-cover select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/property-placeholder.svg";
                          }}
                        />
                      )}

                      {/* Slide index badge */}
                      {mediaUrls.length > 1 && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold z-10">
                          {toPersianDigits(activeSlide + 1)} /{" "}
                          {toPersianDigits(mediaUrls.length)}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Left/Right Navigation arrows */}
                {mediaUrls.length > 1 && (
                  <>
                    {activeSlide > 0 && (
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {activeSlide < mediaUrls.length - 1 && (
                      <button
                        type="button"
                        onClick={handleNextSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                {/* Dot Indicators */}
                {mediaUrls.length > 1 && (
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
                    {mediaUrls.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          dotIdx === activeSlide
                            ? "w-4 bg-primary shadow-xs"
                            : "bg-white/60"
                        )}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-500" />
                <p className="text-xs font-bold text-slate-300">
                  هنوز عکسی آپلود نشده است
                </p>
                <p className="text-[11px] text-slate-500">
                  تصاویر اسلاید در این قسمت نمایش داده خواهند شد
                </p>
              </div>
            )}
          </div>

          {/* Mockup Action Bar */}
          <div className="p-3.5 space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-700">
                <Heart className="w-5 h-5 hover:text-red-500 cursor-pointer transition-colors" />
                <MessageCircle className="w-5 h-5 hover:text-slate-900 cursor-pointer transition-colors" />
                <Send className="w-5 h-5 hover:text-slate-900 cursor-pointer transition-colors" />
              </div>
              <Bookmark className="w-5 h-5 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors" />
            </div>

            {/* Title / Headline */}
            {title && (
              <h4 className="text-xs font-black text-slate-900 pt-1">
                {title}
              </h4>
            )}

            {/* Caption Body */}
            <div className="text-xs text-slate-700 leading-relaxed font-normal">
              <span className="font-bold text-slate-900 ml-1.5">
                {publisher.name || "ناشر"}
              </span>
              <span>
                {caption ? (
                  showFullCaption || caption.length <= 120 ? (
                    caption
                  ) : (
                    <>
                      {caption.slice(0, 120)}...{" "}
                      <button
                        type="button"
                        onClick={() => setShowFullCaption(true)}
                        className="text-slate-400 font-bold hover:text-slate-600"
                      >
                        بیشتر
                      </button>
                    </>
                  )
                ) : (
                  <span className="text-slate-400 italic">متن کپشن در اینجا نمایش داده خواهد شد...</span>
                )}
              </span>
            </div>

            {/* Date preview */}
            <div className="text-[10px] text-slate-400 pt-1">
              همین الان • ملک تودی
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
