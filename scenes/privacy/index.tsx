"use client";

import { Footer } from "@/components/layout/Footer";
import { cn, toPersianDigits } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Cookie,
  Copy,
  Database,
  Eye,
  FileCheck2,
  FileText,
  Key,
  Lock,
  Phone,
  RefreshCw,
  Scale,
  Server,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function PrivacyScene() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("intro");

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} کپی شد`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const sectionsList = [
    { id: "intro", title: "مقدمه و تعاریف کلی", icon: FileText },
    { id: "section-1", title: "۱. اطلاعات و مجوزهای دریافتی", icon: Database },
    { id: "section-2", title: "۲. اهداف پردازش داده‌ها", icon: Eye },
    { id: "section-3", title: "۳. اشتراک‌گذاری با اشخاص ثالث", icon: Share2 },
    { id: "section-4", title: "۴. محافظت و امنیت داده‌ها", icon: ShieldCheck },
    { id: "section-5", title: "۵. کنترل‌ها و حقوق کاربران", icon: UserCheck },
    { id: "section-6", title: "۶. راه‌های ارتباط و تماس", icon: Phone },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-6 pb-16 space-y-8 md:space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="راهنمای مسیر" className="flex items-center gap-2 text-xs text-foreground-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            صفحه اصلی
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rotate-180 text-foreground-muted/60" />
          <Link href="/about" className="hover:text-foreground transition-colors">
            درباره ما
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rotate-180 text-foreground-muted/60" />
          <span className="text-foreground font-medium">سیاست و حریم خصوصی</span>
        </nav>

        {/* Header - Clean, Minimal & Formal */}
        <section className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-primary font-medium border border-border">
              <Shield className="w-3.5 h-3.5" />
              <span>سند حقوقی و حریم خصوصی</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-foreground-muted border border-border">
              <Clock className="w-3.5 h-3.5" />
              <span>آخرین به‌روزرسانی: {toPersianDigits("01/08/1405")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-foreground-muted border border-border">
              <span>تاریخ اجرا: {toPersianDigits("01/08/1405")}</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              سیاست‌نامه حریم خصوصی و حفاظت از داده‌های کاربران ملک تودی
            </h1>
            <p className="text-foreground-muted text-sm sm:text-base leading-relaxed max-w-4xl">
              این سند نحوه جمع‌آوری، پردازش، نگهداری و حفاظت از اطلاعات شخصی کاربران را در وب‌سایت‌ها و اپلیکیشن‌های متعلق به «شرکت بهین کاشانه امروز» (ملک تودی) تشریح می‌کند.
            </p>
          </div>
        </section>

        {/* Layout Grid: Sidebar TOC + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of Contents - Desktop Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
            <div className="bg-surface rounded-2xl border border-border/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground pb-2 border-b border-border/60">
                <FileCheck2 className="w-4 h-4 text-primary" />
                <span>فهرست بخش‌های سند</span>
              </div>

              <nav className="space-y-1">
                {sectionsList.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-right transition-colors cursor-pointer",
                      activeSection === sec.id
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-secondary"
                    )}
                  >
                    <sec.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{sec.title}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-3 border-t border-border/60 text-[11px] text-foreground-muted space-y-1">
                <p>پشتیبانی حریم خصوصی:</p>
                <a
                  href="tel:02191003417"
                  dir="ltr"
                  className="font-bold text-primary block hover:underline"
                >
                  {toPersianDigits("021 9100 3417")}
                </a>
              </div>
            </div>
          </aside>

          {/* Main Legal Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* مقدمه */}
            <section id="intro" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>مقدمه و تعاریف</h2>
              </div>

              <div className="space-y-4 text-sm leading-loose text-foreground-muted text-justify">
                <p>
                  «شرکت بهین کاشانه امروز»، مالک و گرداننده «پلتفرم ملک تودی» شامل وب‌سایت به نشانی{" "}
                  <strong className="text-foreground">melktoday.ir</strong> و{" "}
                  <strong className="text-foreground">melktoday.com</strong> و اپلیکیشن‌‌های اندروید (Android) و آی‌اواس (iOS) است که بستری برای ثبت آگهی، معرفی املاک و تعامل فعالان حوزه مسکن فراهم می‌آورد.
                </p>
                <p>
                  در این سیاست‌نامه، هر جا از «ملک تودی» یا «ما» یاد می‌شود، منظور همین شرکت است و هر جا از «کاربر(ان)» یا «شما» نام برده می‌شود، منظور هر شخصی است که به هر نحو از پلتفرم ملک تودی استفاده می‌کند؛ اعم از اشخاصی که دارای حساب کاربری فعال هستند و اشخاصی که بدون ایجاد حساب، صرفاً به عنوان بازدیدکننده به مشاهده محتوا یا استفاده محدود از خدمات پلتفرم ملک تودی می‌پردازند.
                </p>
                <p>
                  حفاظت از داده‌های شخصی و حریم خصوصی شما یکی از اصول بنیادین فعالیت ما است. منظور از داده شخصی، هرگونه اطلاعاتی است که شما به ما ارائه می‌دهید و باعث شناسایی شما می‌شود یا هر اطلاعات دیگری که می‌توان منطقاً با هویت شما مرتبط دانست.
                </p>

                <div className="p-4 rounded-xl bg-surface-secondary border-r-2 border-r-primary text-xs leading-relaxed text-foreground font-medium">
                  این سیاست‌نامه به شما کمک می‌کند تا بدانید چه اطلاعاتی جمع‌آوری می‌شود، بر چه مبنایی پردازش می‌گردد، چگونه از آن‌ها محافظت می‌شود و چه کنترل‌هایی بر اطلاعات خود در اختیار دارید.
                </div>
              </div>
            </section>

            {/* بخش ۱: چه اطلاعاتی جمع‌آوری می‌کنیم؟ */}
            <section id="section-1" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>۱. چه اطلاعاتی جمع‌آوری می‌کنیم و از چه دسترسی‌هایی استفاده می‌کنیم؟</h2>
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-foreground-muted">
                {/* ۱-۱ اطلاعات مستقیم */}
                <div className="space-y-3">
                  <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                    <span className="text-primary font-bold">۱-۱.</span>
                    <span>اطلاعاتی که شما مستقیماً ارائه می‌دهید</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-2 pr-2 text-xs sm:text-sm">
                    <li>
                      <strong className="text-foreground">اطلاعات حساب کاربری:</strong> هنگام ثبت‌نام و ورود، شماره تلفن همراه شما برای اعتبارسنجی پیامکی دریافت می‌شود. برای ثبت آگهی یا ارتقای حساب کاربری، نام، نام خانوادگی و در صورت لزوم کد ملی (جهت انطباق با قوانین سامانه املاک و اسکان) دریافت می‌گردد.
                    </li>
                    <li>
                      <strong className="text-foreground">محتوای آگهی‌ها:</strong> عنوان، مشخصات ملک (متراژ، قیمت، امکانات، موقعیت جغرافیایی، تصاویر، ویدیوها) و شماره تماس اعلامی برای نمایش به مخاطبان.
                    </li>
                    <li>
                      <strong className="text-foreground">پیام‌ها و ارتباطات:</strong> مکاتبات با واحد پشتیبانی، چت‌های درون‌برنامه‌ای، بازخوردها و تیکت‌ها جهت پیگیری و بهبود کیفیت خدمات.
                    </li>
                    <li>
                      <strong className="text-foreground">اطلاعات پرداخت و تراکنش‌ها:</strong> سوابق پرداخت هزینه بسته‌ها و خدمات نردبان یا فوری از طریق درگاه‌های شاپرک (اطلاعات حساس بانکی نظیر شماره کارت و رمز دوم مستقیماً در درگاه بانکی پردازش شده و در سامانه‌های ملک تودی ذخیره نمی‌شوند).
                    </li>
                  </ul>
                </div>

                {/* ۱-۲ اطلاعات خودکار */}
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                    <span className="text-primary font-bold">۱-۲.</span>
                    <span>اطلاعاتی که هنگام استفاده از خدمات جمع‌آوری می‌شوند</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-2 pr-2 text-xs sm:text-sm">
                    <li>
                      <strong className="text-foreground">داده‌های دستگاه و شبکه:</strong> نوع دستگاه، مدل، سیستم‌عامل، نگارش مرورگر، نشانی IP، و شناسه‌های نرم‌افزاری استاندارد دستگاه.
                    </li>
                    <li>
                      <strong className="text-foreground">داده‌های تعاملی و لاگ‌ها:</strong> صفحات بازدیدشده، جست‌وجوهای ملکی انجام‌شده، زمان‌های اتصال و گزارش‌های خطای نرم‌افزاری جهت رفع باگ‌ها.
                    </li>
                    <li>
                      <strong className="text-foreground">موقعیت مکانی تقریبی:</strong> تشخیص محدوده شهری از طریق IP جهت ارائه نتایج محلی و دقیق‌تر.
                    </li>
                  </ul>
                </div>

                {/* ۱-۳ مجوزها و دسترسی‌ها */}
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                    <span className="text-primary font-bold">۱-۳.</span>
                    <span>مجوزها و دسترسی‌های درخواستی در اپلیکیشن</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-primary" />
                        <span>دوربین و حافظه ذخیره‌سازی</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        صرفاً برای عکاسی یا بارگذاری تصاویر و مدارک مرتبط با ملک در هنگام ثبت آگهی.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        <span>موقعیت مکانی (GPS)</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        در صورت موافقت کاربر، جهت ثبت دقیق نقطه جغرافیایی ملک روی نقشه یا جستجوی اطراف من.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>اعلان‌ها (Notifications)</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        جهت ارسال وضعیت انتشار آگهی، پیام‌های چت مخاطبان و تغییرات مهم حساب کاربری.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <Cookie className="w-3.5 h-3.5 text-primary" />
                        <span>کوکی‌ها و نشست‌های وب</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        برای حفظ وضعیت ورود کاربر، ذخیره املاک نشان‌شده و بهینه‌سازی بارگذاری صفحات.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* بخش ۲: اهداف پردازش */}
            <section id="section-2" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>۲. چرا اطلاعات شما را پردازش می‌کنیم؟</h2>
              </div>

              <div className="space-y-4 text-sm leading-loose text-foreground-muted">
                <p>
                  پردازش اطلاعات شما در چارچوب قوانین جمهوری اسلامی ایران (قانون تجارت الکترونیک، قانون جرایم رایانه‌ای و آیین‌نامه‌های ساماندهی بازار مسکن) و بر مبنای ضرورت‌های زیر صورت می‌پذیرد:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">
                      ۱. ارائه و بهبود خدمات پلتفرم
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      ایجاد حساب، ثبت و نمایش آگهی‌ها، ایجاد امکان چت و ارتباط، مدیریت پنل‌های ویژه مشاوران املاک و بهینه‌سازی موتور جست‌وجوی ملک.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">
                      ۲. ارتقای امنیت و پیشگیری از تخلف و کلاهبرداری
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      شناسایی رفتارهای غیرعادی، جلوگیری از انتشار آگهی‌های فیک، اسپم یا قیمت‌های نامتعارف، و راستی‌آزمایی هویت آگهی‌دهندگان جهت حفظ آرامش بازار.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">
                      ۳. پشتیبانی، پیگیری و ارتباط با مشتریان
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      پاسخگویی به سوالات، حل تعارضات گزارش‌شده توسط کاربران، ارسال پیامک‌های تغییر وضعیت آگهی یا فاکتور خدمات.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* بخش ۳: اشخاص ثالث */}
            <section id="section-3" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>۳. در چه مواردی اطلاعات شما در اختیار اشخاص ثالث قرار می‌گیرد؟</h2>
              </div>

              <div className="space-y-4 text-sm leading-loose text-foreground-muted text-justify">
                <p>
                  ملک تودی داده‌های شخصی کاربران را تحت هیچ عنوان به اشخاص، شرکت‌ها یا مقاصد تبلیغاتی شخص ثالث <strong className="text-foreground">نمی‌فروشد و اجاره نمی‌دهد</strong>. افشای اطلاعات صرفاً در موارد مشخص و محدود زیر اتفاق می‌افتد:
                </p>

                <ul className="list-disc list-inside space-y-2 pr-2 text-xs sm:text-sm">
                  <li>
                    <strong className="text-foreground">اطلاعات عمومی آگهی‌ها:</strong> مشخصات ملک، عکس‌ها و شماره تماسی که به عنوان آگهی‌دهنده تعیین کرده‌اید، به صورت عمومی برای متقاضیان قابل مشاهده است.
                  </li>
                  <li>
                    <strong className="text-foreground">پیمانکاران و ارائه‌دهندگان خدمات زیرساختی:</strong> شرکت‌های پیام‌رسانی پیامک، درگاه‌های پرداخت بانکی شاپرک، و سرویس‌های میزبانی ابری امن که بر اساس قراردادهای محرمانگی سخت‌گیرانه با ما همکاری می‌کنند.
                  </li>
                  <li>
                    <strong className="text-foreground">الزامات قانونی و دستورات مراجع قضایی:</strong> در صورت صدور دستور کتبی و رسمی از سوی مراجع قضایی یا نهادهای انتظامی صالح مطابق با قوانین کشور.
                  </li>
                </ul>
              </div>
            </section>

            {/* بخش ۴: امنیت و نگهداری داده‌ها */}
            <section id="section-4" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>۴. چگونه از اطلاعات شما محافظت و نگهداری می‌کنیم؟</h2>
              </div>

              <div className="space-y-4 text-sm leading-loose text-foreground-muted">
                <p>
                  ما پروتکل‌های امنیتی فنی و استانداردهای روز نرم‌افزاری را برای صیانت از داده‌های شما به کار می‌گیریم:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>رمزنگاری در انتقال (HTTPS/TLS)</span>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      کلیه ارتباطات بین کاربر و سرورها از طریق گواهی‌های امنیتی SSL/TLS به صورت رمزگذاری‌شده منتقل می‌شود.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                      <Key className="w-4 h-4 text-primary" />
                      <span>احراز هویت دو مرحله‌ای و OTP</span>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      ورود به حساب از طریق کدهای یک‌بارمصرف پیامکی ایمن‌سازی شده تا خطر سرقت گذرواژه به صفر برسد.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>محدودیت دسترسی سازمانی</span>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      تنها کارکنان احراز صلاحیت‌شده و مرتبط با بخش پشتیبانی یا فنی، آن هم در حداقل حدود اختیارات لازم، به داده‌ها دسترسی دارند.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                      <Server className="w-4 h-4 text-primary" />
                      <span>پشتیبان‌گیری مستمر</span>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      تهیه نسخه‌های منظم پشتیبان در سرورهای ابری ایزوله داخل کشور جهت جلوگیری از اتلاف یا پاک شدن ناخواسته اطلاعات.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-secondary border-r-2 border-r-accent text-xs leading-relaxed text-foreground">
                  <strong>توصیه امنیتی:</strong> هرگز کدهای پیامک‌شده از سوی ملک تودی یا اطلاعات محرمانه حساب خود را در اختیار دیگران قرار ندهید. پشتیبانان ما هرگز کد تایید شما را مطالبه نخواهند کرد.
                </div>
              </div>
            </section>

            {/* بخش ۵: حقوق کاربران */}
            <section id="section-5" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>۵. چه کنترل‌ها و امکاناتی برای مدیریت اطلاعات خود دارید؟</h2>
              </div>

              <div className="space-y-4 text-sm leading-loose text-foreground-muted">
                <p>
                  ما کنترل کاملی بر اطلاعات در اختیارتان می‌گذاریم:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                    <h4 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>مشاهده و ویرایش اطلاعات</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      شما می‌توانید از بخش پروفایل کاربری، مشخصات خود یا اطلاعات آگهی‌های ثبت‌شده را به‌روزرسانی یا ویرایش کنید.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                    <h4 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-primary" />
                      <span>درخواست حذف حساب کاربری</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      امکان ثبت درخواست حذف حساب از طریق تماس با پشتیبانی وجود دارد. توجه داشته باشید طبق مقررات قانونی (ماده ۳۲ قانون تجارت الکترونیک)، سوابق تراکنش‌ها و شناسه کاربران حداقل به مدت ۶ ماه پس از خاتمه اشتراک برای اهداف حقوقی بایگانی می‌گردد.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-secondary border border-border/60 space-y-1">
                    <h4 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-primary" />
                      <span>اطلاع‌رسانی تغییرات در سیاست‌نامه</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      هرگونه تغییر اساسی و ماهوی در مفاد این سیاست‌نامه دو ماه قبل از اجرا از طریق اعلان‌های درون‌برنامه‌ای، وب‌سایت یا پیامک به اطلاع شما خواهد رسید.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* بخش ۶: تماس با ما */}
            <section id="section-6" className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                <h2>۶. چگونه با ما تماس بگیرید؟</h2>
              </div>

              <div className="space-y-4 text-sm leading-loose text-foreground-muted">
                <p>
                  جهت هرگونه پرسش، ابهام، پیگیری حقوقی یا ثبت درخواست‌های مرتبط با حفاظت از حریم خصوصی داده‌های خود، با مسئولان حریم خصوصی ملک تودی تماس حاصل فرمایید:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 space-y-2">
                    <span className="text-xs text-foreground-muted block">تلفن پشتیبانی مرکزی</span>
                    <a
                      href="tel:02191003417"
                      dir="ltr"
                      className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {toPersianDigits("021 9100 3417")}
                    </a>
                    <button
                      onClick={() => handleCopy("02191003417", "phone", "شماره تلفن")}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline pt-1 cursor-pointer"
                    >
                      {copiedKey === "phone" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "phone" ? "کپی شد" : "کپی شماره تلفن"}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 space-y-2">
                    <span className="text-xs text-foreground-muted block">پیام‌رسان‌ها (تلگرام، واتساپ، بله، روبیکا)</span>
                    <a
                      href="tel:09199173417"
                      dir="ltr"
                      className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {toPersianDigits("0919 917 3417")}
                    </a>
                    <button
                      onClick={() => handleCopy("09199173417", "mobile", "شماره همراه")}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline pt-1 cursor-pointer"
                    >
                      {copiedKey === "mobile" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "mobile" ? "کپی شد" : "کپی شماره همراه"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-secondary border border-border/60 text-xs text-foreground-muted space-y-1">
                  <p className="font-bold text-foreground">نشانی ثبتی شرکت:</p>
                  <p>تهران، میدان ونک، برج نگار (فاقد پذیرش حضوری عمومی - مراجعه صرفاً با هماهنگی کتبی قبلی).</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
