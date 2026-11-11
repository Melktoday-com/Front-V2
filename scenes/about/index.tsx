"use client";

import { Footer } from "@/components/layout/Footer";
import { cn, toPersianDigits } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  FileText,
  HeartHandshake,
  HelpCircle,
  Layers,
  Lock,
  MapPin,
  Navigation as NavigationIcon,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function AboutScene() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} کپی شد`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const contactNumbers = [
    {
      label: "تلفن دفتر مرکزی",
      phone: "02191003417",
      display: "۰۲۱ ۹۱۰۰ ۳۴۱۷",
      icon: Phone,
      key: "landline",
      note: "پاسخگویی در ساعات کاری",
    },
    {
      label: "تلفن همراه و پشتیبانی",
      phone: "09199173417",
      display: "۰۹۱۹ ۹۱۷ ۳۴۱۷",
      icon: Smartphone,
      key: "mobile",
      note: "تماس تلفنی و پیام‌رسان‌ها",
    },
  ];

  const addressText = "تهران، میدان ونک، برج نگار";

  const coreValues = [
    {
      title: "شفافیت و صحت اطلاعات",
      desc: "ارائه جزئیات دقیق، قیمت‌گذاری منطقی و آگهی‌های راستی‌آزمایی‌شده برای ایجاد بستری امن و قابل اتکا.",
      icon: ShieldCheck,
    },
    {
      title: "سادگی و سهولت کاربری",
      desc: "حذف مراحل پیچیده، فیلترهای هوشمند جستجو و رابط کاربری خلوت تا در سریع‌ترین زمان به نتیجه برسید.",
      icon: Sparkles,
    },
    {
      title: "پوشش یکپارچه و جامع",
      desc: "دربرگیری خرید، فروش، رهن، اجاره بلندمدت و اقامتگاه‌های روزانه در بستری متمرکز و مدرن.",
      icon: Layers,
    },
    {
      title: "ارتباط بدون واسطه",
      desc: "تسهیل تعامل مستقیم، محترمانه و حرفه‌ای میان متقاضیان، مالکان و مشاوران باسابقه بازار مسکن.",
      icon: HeartHandshake,
    },
  ];

  const userGroups = [
    {
      title: "خریداران و سرمایه‌گذاران",
      desc: "دسترسی به فرصت‌های واقعی ملکی با اطلاعات کامل و بدون ابهام جهت تصمیمی امن.",
      icon: Target,
    },
    {
      title: "مستأجران و مسافران",
      desc: "پیدا کردن سریع مسکن مناسب یا اقامتگاه‌های روزانه استاندارد با قیمت شفاف.",
      icon: Users,
    },
    {
      title: "مالکان و سازندگان",
      desc: "ثبت آسان آگهی و رساندن فایل ملکی به مخاطبان هدف و خریداران واقعی بدون پیچیدگی.",
      icon: Building2,
    },
    {
      title: "مشاوران و دفاتر املاک",
      desc: "پنل حرفه‌ای، ثبت نشان تجاری و نمایش فایل‌ها به هزاران بازدیدکننده فعال روزانه.",
      icon: Compass,
    },
  ];

  const legalAndHelpLinks = [
    {
      title: "سیاست و حریم خصوصی",
      desc: "نحوه گردآوری، پردازش و حفاظت از داده‌های شخصی و دسترسی‌های کاربران در ملک تودی.",
      href: "/privacy",
      icon: Lock,
      tag: "حفاظت داده‌ها",
    },
    {
      title: "سوالات متداول (FAQ)",
      desc: "پاسخ سریع و دسته‌بندی‌شده به پرسش‌های رایج درباره ثبت‌نام، آگهی‌ها، پنل‌ها و امنیت.",
      href: "/faq",
      icon: HelpCircle,
      tag: "راهنمای کاربری",
    },
    {
      title: "شرایط و مقررات",
      desc: "ضوابط قانونی و چارچوب حقوقی استفاده از پلتفرم و ثبت معاملات و آگهی‌ها.",
      href: "/rules",
      icon: FileText,
      tag: "قوانین و ضوابط",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full pt-6 pb-16 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="راهنمای مسیر" className="flex items-center gap-2 text-xs text-foreground-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            صفحه اصلی
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rotate-180 text-foreground-muted/60" />
          <span className="text-foreground font-medium">درباره ما</span>
        </nav>

        {/* Hero Section - Minimalist & Elegant */}
        <section className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-10 md:p-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs text-foreground-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>پلتفرم تخصصی املاک و اقامتگاه</span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-snug sm:leading-snug">
              ساده‌تر، سریع‌تر و شفاف‌تر در مسیر جست‌وجو و معامله ملک
            </h1>
            <p className="text-foreground-muted text-sm sm:text-base leading-relaxed">
              ملک تودی با هدف شفاف‌سازی و سهولت انتخاب شکل گرفته است؛ جایی که خریداران، مستأجران،
              مالکان و مشاوران املاک بر پایه اطلاعات دقیق و محیطی مدرن به یکدیگر متصل می‌شوند.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/ads"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>جستجوی املاک</span>
            </Link>
            <Link
              href="/ads/submit"
              className="inline-flex items-center gap-2 bg-surface hover:bg-surface-secondary text-foreground border border-border font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-foreground-muted" />
              <span>ثبت رایگان آگهی</span>
            </Link>
          </div>
        </section>

        {/* Mission & Story Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg sm:text-xl">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            <h2>داستان و نگرش ملک تودی</h2>
          </div>

          <div className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-5 text-sm sm:text-base leading-loose text-foreground-muted">
            <p className="text-foreground font-medium">
              ما در ملک تودی بر این باوریم که تصمیم‌گیری ملکی یکی از سرنوشت‌سازترین انتخاب‌های زندگی هر فرد یا کسب‌وکار است. از این رو، مأموریت خود را فراتر از نمایش آگهی‌ها تعریف کرده‌ایم.
            </p>

            <p>
              تمرکز ما بر کاهش ابهامات بازار، ارتقای شفافیت قیمت‌ها و ارائه ابزارهایی هوشمند است تا دسترسی به اطلاعات کلیدی محله‌ها، مشخصات فنی واحدها و اعتبار آگهی‌دهندگان با کمترین زحمت ممکن محقق شود.
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-surface-secondary border-r-2 border-r-primary text-xs sm:text-sm leading-relaxed text-foreground font-medium">
              «هدف ما ایجاد تجربه‌ای آرام، دقیق و قابل اتکا است؛ بستری که در آن داده‌های درست مبنای بهترین تصمیمات شما باشد.»
            </div>

            <p>
              پلتفرم ملک تودی همواره در حال گسترش و توسعه امکانات جدید برای همه ذی‌نفعان بازار مسکن است؛ از جست‌وجوی نقشه‌محور تا پنل‌های سازمانی دفاتر املاک و سیستم رزرو اقامتگاه‌های کوتاه‌مدت.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg sm:text-xl">
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              <h2>اصول و تعهدات بنیادین</h2>
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted pr-3">
              ارزش‌هایی که مسیر توسعه و خدمت‌رسانی ما را مشخص می‌کنند
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coreValues.map((val, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-2xl border border-border/70 p-5 sm:p-6 space-y-3 hover:border-border transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-secondary text-primary flex items-center justify-center">
                  <val.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">{val.title}</h3>
                <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Target Audience */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg sm:text-xl">
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              <h2>پوشش نیازهای فعالان بازار</h2>
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted pr-3">
              امکانات متناسب برای هر دسته از همراهان ملک تودی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userGroups.map((group, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-2xl border border-border/70 p-5 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-surface-secondary text-primary flex items-center justify-center">
                    <group.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{group.title}</h3>
                  <p className="text-xs text-foreground-muted leading-relaxed">{group.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Legal & Trust Hub (Links to Privacy, FAQ, and Rules) */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg sm:text-xl">
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              <h2>شفافیت، حریم خصوصی و راهنما</h2>
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted pr-3">
              اطلاعات حقوقی، مستندات حریم خصوصی و پاسخ به پرسش‌های رایج کاربران
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {legalAndHelpLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="group bg-surface hover:bg-surface-secondary rounded-2xl border border-border/70 hover:border-primary/40 p-5 flex flex-col justify-between transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-surface-secondary group-hover:bg-surface text-primary flex items-center justify-center transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground-muted bg-surface-secondary px-2.5 py-0.5 rounded-full border border-border/60">
                      {item.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
                  <span>مشاهده صفحه</span>
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact & Office Section */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg sm:text-xl">
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              <h2>راه‌های ارتباطی و نشانی</h2>
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted pr-3">
              مشتاق دریافت نظرات، پرسش‌ها و همکاری‌های مشترک با شما هستیم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactNumbers.map((item) => (
              <div
                key={item.key}
                className="bg-surface rounded-2xl border border-border/70 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-secondary text-primary flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-foreground-muted block">{item.label}</span>
                      <a
                        href={`tel:${item.phone}`}
                        dir="ltr"
                        className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors tracking-wide block mt-0.5"
                      >
                        {toPersianDigits(item.phone)}
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.phone, item.key, item.label)}
                    className="p-2 rounded-lg bg-surface-secondary hover:bg-border/50 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    title="کپی شماره"
                  >
                    {copiedKey === item.key ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">{item.note}</span>
                  <a
                    href={`tel:${item.phone}`}
                    className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                  >
                    <span>تماس مستقیم</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}

            {/* Address */}
            <div className="bg-surface rounded-2xl border border-border/70 p-5 md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-foreground-muted block">نشانی دفتر مرکزی</span>
                    <p className="text-sm sm:text-base font-bold text-foreground">
                      {addressText}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      مراجعه حضوری با هماهنگی و تعیین وقت قبلی انجام می‌پذیرد.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => handleCopy(addressText, "address", "نشانی دفتر")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-border/50 text-xs font-medium text-foreground transition-colors cursor-pointer"
                  >
                    {copiedKey === "address" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-foreground-muted" />
                        <span>کپی آدرس</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      addressText
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-surface-secondary px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <NavigationIcon className="w-3.5 h-3.5" />
                    <span>مسیریابی</span>
                    <ExternalLink className="w-3 h-3 text-foreground-muted" />
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-foreground-muted">
                <Clock className="w-4 h-4 text-foreground-muted shrink-0" />
                <span>ساعات پاسخگویی: شنبه تا چهارشنبه ۹ الی ۲۱ | پنج‌شنبه‌ها ۹ الی ۱۸</span>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Bottom Action Banner */}
        <section className="bg-surface-secondary rounded-2xl border border-border/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              آماده شروع هستید؟
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted">
              هزاران فرصت ملکی در انتظار شماست یا همین حالا آگهی خود را به رایگان منتشر کنید.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/ads"
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs sm:text-sm px-4 py-2 rounded-xl transition-colors"
            >
              مشاهده آگهی‌ها
            </Link>
            <Link
              href="/ads/submit"
              className="bg-surface hover:bg-surface-secondary text-foreground border border-border font-medium text-xs sm:text-sm px-4 py-2 rounded-xl transition-colors"
            >
              ثبت آگهی
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
