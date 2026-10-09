"use client";

import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  HeartHandshake,
  Layers,
  MapPin,
  Navigation as NavigationIcon,
  Phone,
  PlusCircle,
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
      phone: "05191001717",
      display: "۰۵۱۹۱۰۰۱۷۱۷",
      icon: Phone,
      key: "landline",
      note: "پاسخگویی در ساعات کاری",
    },
    {
      label: "تلفن همراه و پشتیبانی ۲۴/۷",
      phone: "09199173417",
      display: "۰۹۱۹۹۱۷۳۴۱۷",
      icon: Smartphone,
      key: "mobile",
      note: "تماس تلفنی و پیام‌رسان‌ها",
    },
  ];

  const addressText = "مشهد، بلوار وکیل آباد، بلوار هاشمیه، هاشمیه ۳، پلاک ۱۰";

  const coreValues = [
    {
      title: "شفافیت و صداقت اطلاعات",
      desc: "در ملک تودی اطلاعات دقیق، جزئیات معتبر و قیمت‌گذاری‌های شفاف ارائه می‌شود تا با دیدی باز تصمیم بگیرید.",
      icon: ShieldCheck,
      color: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200/50",
    },
    {
      title: "ساده‌تر و سریع‌تر",
      desc: "مسیر جست‌وجوی ملک را با فیلترهای هوشمند، جستجوی نقشه‌محور و رابط کاربری مدرن به تجربه‌ای لذت‌بخش تبدیل کرده‌ایم.",
      icon: Sparkles,
      color: "from-primary/10 to-primary/5 text-primary border-primary/20",
    },
    {
      title: "بستر یکپارچه و جامع",
      desc: "پوشش همه‌جانبه معاملات شامل خرید، فروش، رهن، اجاره بلندمدت و اقامتگاه‌های روزانه در یک پلتفرم واحد.",
      icon: Layers,
      color: "from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200/50",
    },
    {
      title: "ارتباط مستقیم و موثر",
      desc: "پل ارتباطی حرفه‌ای و امن میان خریداران، مستأجران، مالکان و مشاوران و آژانس‌های املاک برتر بازار.",
      icon: HeartHandshake,
      color: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200/50",
    },
  ];

  const userGroups = [
    {
      title: "خریداران و سرمایه‌گذاران",
      desc: "بررسی گزینه‌های متنوع ملکی با اطلاعات کامل و بدون ابهام برای سرمایه‌گذاری پرسود و مطمئن.",
      icon: Target,
    },
    {
      title: "مستأجران و مسافران",
      desc: "پیدا کردن سریع خانه مسکونی، تجاری یا رزرو اقامتگاه‌های روزانه با بهترین قیمت و دسترسی آسان.",
      icon: Users,
    },
    {
      title: "مالکان و سازندگان",
      desc: "ثبت آسان و بدون دغدغه آگهی‌های فروش و اجاره و ارتباط با مشتریان واقعی در کوتاه‌ترین زمان.",
      icon: Building2,
    },
    {
      title: "آژانس‌ها و مشاوران املاک",
      desc: "پنل اختصاصی مدیریت فایل‌ها، برندسازی آژانس و دسترسی به بازار بزرگ مشتریان هدف.",
      icon: Compass,
    },
  ];

  return (
    <div className="flex flex-col gap-8 md:gap-14 pt-4 sm:pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-8 md:space-y-14">
        {/* Breadcrumb Navigation */}
        <nav aria-label="راهنمای مسیر" className="flex items-center gap-2 text-xs text-secondary">
        <Link href="/" className="hover:text-brand transition-colors">
          صفحه اصلی
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180 text-secondary/50" />
        <span className="text-brand font-bold">درباره ما</span>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl md:rounded-[36px] bg-gradient-to-br from-brand via-[#2B326B] to-brand text-white p-6 sm:p-10 md:p-14 shadow-xl">
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-black text-primary">
            <Sparkles className="w-4 h-4" />
            <span>درباره پلتفرم ملک تودی</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight sm:leading-tight md:leading-tight text-white tracking-tight">
            ساده‌تر، سریع‌تر و شفاف‌تر در مسیر جست‌وجو و معامله ملک
          </h1>

          <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
            ملک تودی؛ جایی برای پیدا کردن ملک مناسب، با اطلاعاتی که به تصمیم بهتر کمک می‌کند.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/ads"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>جستجوی املاک</span>
            </Link>
            <Link
              href="/ads/submit"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-sm px-6 py-3.5 rounded-2xl border border-white/15 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-primary" />
              <span>ثبت آگهی</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Narrative Section: Story & Vision */}
      <section className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-soft-border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-7 bg-primary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black text-brand tracking-tight">
              داستان و هدف ملک تودی
            </h2>
          </div>

          <div className="space-y-5 text-secondary text-sm sm:text-base leading-loose text-justify font-normal">
            <p className="text-brand font-medium">
              <strong className="text-brand font-black">ملک تودی</strong> با هدف ساده‌تر، سریع‌تر و شفاف‌تر کردن مسیر جست‌وجو و معامله ملک شکل گرفته است.
            </p>

            <p>
              ما تلاش می‌کنیم با ایجاد بستری یکپارچه برای معرفی و جست‌وجوی انواع املاک، دسترسی به اطلاعات موردنیاز را برای خریداران، مستأجران، مالکان و فعالان حوزه املاک آسان‌تر کنیم.
            </p>

            <div className="p-5 sm:p-6 rounded-2xl bg-soft-bg border-r-4 border-r-primary border-y border-l border-soft-border space-y-2">
              <p className="text-brand font-bold text-sm sm:text-base leading-relaxed">
                در ملک تودی، هدف فقط نمایش آگهی‌های ملکی نیست؛ بلکه می‌خواهیم تجربه‌ای دقیق‌تر و قابل‌اعتمادتر برای پیدا کردن ملک ایجاد کنیم؛ تجربه‌ای که در آن کاربران بتوانند با دسترسی آسان به اطلاعات، گزینه‌های مختلف را بررسی و آگاهانه‌تر تصمیم‌گیری کنند.
              </p>
            </div>

            <p>
              ملک تودی در مسیر توسعه خود، همواره به بهبود تجربه کاربری، ارائه اطلاعات کاربردی و ایجاد بستری حرفه‌ای برای ارتباط میان متقاضیان و فعالان بازار ملک توجه دارد.
            </p>

            <div className="pt-2 flex items-center gap-2 text-primary font-black text-base sm:text-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>ملک تودی؛ جایی برای پیدا کردن ملک مناسب، با اطلاعاتی که به تصمیم بهتر کمک می‌کند.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values / اصول و ارزش‌ها */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black text-brand tracking-tight">
              اصول و ارزش‌های بنیادین ملک تودی
            </h2>
          </div>
          <p className="text-secondary text-xs sm:text-sm pr-4">
            تعهدی که در هر مرحله از طراحی و ارائه خدمات به آن پایبندیم
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {coreValues.map((val, idx) => (
            <div
              key={idx}
              className={cn(
                "p-6 rounded-3xl bg-gradient-to-br border transition-all duration-300 hover:shadow-md space-y-3",
                val.color
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <val.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-brand">{val.title}</h3>
              <p className="text-secondary text-xs sm:text-sm leading-relaxed font-normal">
                {val.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is Melktoday for? */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black text-brand tracking-tight">
              ملک تودی برای چه کسانی است؟
            </h2>
          </div>
          <p className="text-secondary text-xs sm:text-sm pr-4">
            پاسخگوی نیازهای تمام ذی‌نفعان و فعالان بازار املاک
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {userGroups.map((group, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-3xl border border-soft-border hover:border-primary/40 transition-all shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-soft-bg text-brand flex items-center justify-center font-bold">
                  <group.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-brand">{group.title}</h3>
                <p className="text-secondary text-xs leading-relaxed">{group.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Headquarters Information */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black text-brand tracking-tight">
              ارتباط با ما و دفتر مرکزی
            </h2>
          </div>
          <p className="text-secondary text-xs sm:text-sm pr-4">
            همواره مشتاق شنیدن نظرات، پیشنهادات و پاسخگویی به پرسش‌های شما هستیم
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Phone Numbers Cards */}
          {contactNumbers.map((item) => (
            <div
              key={item.key}
              className="bg-white p-6 rounded-3xl border border-soft-border shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium block">{item.label}</span>
                    <a
                      href={`tel:${item.phone}`}
                      dir="ltr"
                      className="text-lg sm:text-xl font-black text-brand hover:text-primary transition-colors tracking-wider block mt-0.5"
                    >
                      {item.display}
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(item.phone, item.key, item.label)}
                  className="p-2.5 rounded-xl bg-soft-bg hover:bg-soft-border text-secondary hover:text-brand transition-colors cursor-pointer"
                  title="کپی شماره"
                >
                  {copiedKey === item.key ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-soft-border flex items-center justify-between text-xs">
                <span className="text-secondary">{item.note}</span>
                <a
                  href={`tel:${item.phone}`}
                  className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
                >
                  <span>تماس مستقیم</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}

          {/* Address Card */}
          <div className="bg-white p-6 rounded-3xl border border-soft-border shadow-sm flex flex-col justify-between space-y-4 md:col-span-2 hover:border-primary/40 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-secondary font-medium block">نشانی دفتر مرکزی</span>
                  <p className="text-sm sm:text-base font-black text-brand leading-relaxed">
                    {addressText}
                  </p>
                  <p className="text-xs text-secondary pt-0.5">
                    مراجعه حضوری با هماهنگی قبلی امکان‌پذیر است.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => handleCopy(addressText, "address", "نشانی دفتر")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-soft-bg hover:bg-soft-border text-xs font-bold text-secondary hover:text-brand transition-colors cursor-pointer"
                >
                  {copiedKey === "address" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی آدرس</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="pt-4 border-t border-soft-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-secondary">
                <Clock className="w-4 h-4 text-primary" />
                <span>ساعات کاری: شنبه تا چهارشنبه ۹ الی ۲۱ | پنج‌شنبه‌ها ۹ الی ۱۸</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    addressText
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-primary bg-soft-bg px-3 py-1.5 rounded-xl transition-colors"
                >
                  <NavigationIcon className="w-3.5 h-3.5 text-primary" />
                  <span>مسیریابی با نقشه</span>
                  <ExternalLink className="w-3 h-3 text-secondary" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="bg-gradient-to-r from-brand to-[#343D7B] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            همراه شما در انتخاب بهترین ملک
          </h3>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
            فرصت‌های برتر خرید، رهن، اجاره و اقامتگاه‌های روزانه را در ملک تودی کاوش کنید یا ملک خود را به سرعت در معرض دید هزاران مخاطب قرار دهید.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <Link
            href="/ads"
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            کاوش در آگهی‌ها
          </Link>
          <Link
            href="/ads/submit"
            className="bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl border border-white/20 transition-all active:scale-95"
          >
            ثبت رایگان ملک
          </Link>
        </div>
      </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
