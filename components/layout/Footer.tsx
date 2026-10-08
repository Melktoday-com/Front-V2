"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Smartphone,
  MapPin,
  Clock,
  ArrowUp,
  PlusCircle,
  Compass,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";
import { toast } from "sonner";

export function Footer() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} با موفقیت کپی شد`);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full mt-10 md:mt-16 bg-brand text-white overflow-hidden rounded-t-[32px] md:rounded-t-[44px] shadow-2xl border-t border-white/10">


      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand & Mission Column (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                  MELK<span className="text-primary group-hover:opacity-90 transition-opacity">TODAY</span>
                </span>
                <span className="text-[11px] font-black bg-primary/20 text-primary px-2.5 py-0.5 rounded-full border border-primary/30">
                  ملکتودی
                </span>
              </Link>
            </div>

            <p className="text-white/80 text-xs sm:text-sm leading-relaxed text-justify">
              ملکتودی با هدف ساده‌تر، سریع‌تر و شفاف‌تر کردن مسیر جست‌وجو و معامله ملک شکل گرفته است.
              ما بستری یکپارچه برای معرفی و بررسی انواع املاک مسکونی، تجاری و اقامتگاه‌های روزانه ایجاد
              کرده‌ایم تا خریداران، مستأجران، مالکان و مشاورین بتوانند آگاهانه‌تر تصمیم‌گیری کنند.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>ملکتودی؛ جایی برای پیدا کردن ملک مناسب</span>
              </div>
              <Link
                href="/about"
                className="text-xs text-primary font-bold hover:underline shrink-0 flex items-center gap-1"
              >
                <span>درباره ما</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href="/ads/submit"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition-all group"
              >
                <PlusCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>ثبت رایگان آگهی</span>
              </Link>
              <Link
                href="/ads"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all"
              >
                <Compass className="w-4 h-4 text-primary" />
                <span>کاوش در املاک</span>
              </Link>
            </div>
          </div>

          {/* Quick Links Column (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block"></span>
              <span>دسترسی سریع</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>صفحه اصلی</span>
                </Link>
              </li>
              <li>
                <Link href="/ads" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>آگهی‌های خرید و رهن</span>
                </Link>
              </li>
              <li>
                <Link href="/temporary-rent" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>اجاره روزانه و اقامتگاه</span>
                </Link>
              </li>
              <li>
                <Link href="/agency" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>آژانس‌های املاک</span>
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>کاوش و مقالات ملکی</span>
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>نشان‌شده‌ها و علاقه‌مندی‌ها</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Services Column (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block"></span>
              <span>خدمات و راهنما</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors flex items-center gap-1.5 font-bold text-white">
                  <ChevronLeft className="w-3 h-3 text-primary" />
                  <span>درباره ملکتودی</span>
                </Link>
              </li>
              <li>
                <Link href="/ads/submit" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>ثبت آگهی ملک</span>
                </Link>
              </li>
              <li>
                <Link href="/agency/panel" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>پنل مشاوران و آژانس‌ها</span>
                </Link>
              </li>
              <li>
                <Link href="/profile/temporary-rent" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>پنل میزبانان اقامتگاه</span>
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <ChevronLeft className="w-3 h-3 text-primary/70" />
                  <span>ناحیه کاربری</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Address Column (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block"></span>
              <span>اطلاعات تماس و نشانی</span>
            </h3>

            <div className="space-y-3">
              {/* Phone 1: Landline */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/60 block">تلفن دفتر مرکزی</span>
                    <a
                      href="tel:05191001717"
                      dir="ltr"
                      className="text-xs sm:text-sm font-black text-white tracking-wider hover:text-primary transition-colors inline-block"
                    >
                      {toPersianDigits("05191001717")}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy("05191001717", "شماره تلفن دفتر")}
                  title="کپی شماره"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copiedText === "شماره تلفن دفتر" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Phone 2: Mobile / Support */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/60 block">تلفن همراه و پشتیبانی</span>
                    <a
                      href="tel:09199173417"
                      dir="ltr"
                      className="text-xs sm:text-sm font-black text-white tracking-wider hover:text-primary transition-colors inline-block"
                    >
                      {toPersianDigits("09199173417")}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy("09199173417", "شماره همراه پشتیبانی")}
                  title="کپی شماره"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copiedText === "شماره همراه پشتیبانی" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Address */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-white/60 block">نشانی دفتر</span>
                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                      مشهد، بلوار وکیل آباد، بلوار هاشمیه، هاشمیه ۳، پلاک ۱۰
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() =>
                      handleCopy(
                        "مشهد، بلوار وکیل آباد، بلوار هاشمیه، هاشمیه ۳، پلاک ۱۰",
                        "آدرس دفتر"
                      )
                    }
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                  >
                    {copiedText === "آدرس دفتر" ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>کپی نشانی</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Scroll to Top */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-4 sm:px-6 pt-4 pb-24 lg:pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <div className="text-center sm:text-right">
            <span>تمامی حقوق مادی و معنوی این وب‌سایت متعلق به پلتفرم </span>
            <span className="text-white font-bold">ملکتودی (MelkToday)</span>
            <span> می‌باشد.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-primary transition-colors text-white/70">
              درباره ما
            </Link>
            <span className="text-white/20">•</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
              aria-label="بازگشت به ابتدای صفحه"
            >
              <span>بازگشت به بالا</span>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowUp className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
