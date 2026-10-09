"use client";

import { cn, toPersianDigits } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Gavel,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Lock,
  MessageSquare,
  Phone,
  Scale,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function RulesScene() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
    { id: "intro", title: "مقدمه و پذیرش شرایط", icon: FileText },
    { id: "article-1", title: "ماده ۱- معرفی ملک تودی", icon: Building2 },
    { id: "article-2", title: "ماده ۲- شرایط عمومی استفاده", icon: UserCheck },
    { id: "article-3", title: "ماده ۳- سیاست‌های سایت و اپلیکیشن", icon: ShieldAlert },
    { id: "article-4", title: "ماده ۴- حقوق و مسئولیت‌های ملک تودی", icon: ShieldCheck },
    { id: "article-5", title: "ماده ۵- حقوق و مسئولیت‌های کاربر", icon: Users },
    { id: "article-6", title: "ماده ۶- ضمانت‌اجرای تخلف از تعهدات", icon: Gavel },
    { id: "article-7", title: "ماده ۷- مالکیت فکری", icon: Sparkles },
    { id: "article-8", title: "ماده ۸- حفاظت از حریم خصوصی", icon: Lock },
    { id: "article-9", title: "ماده ۹- حل و فصل اختلافات", icon: Scale },
    { id: "article-10", title: "ماده ۱۰- ارتباط با ما", icon: Phone },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-10 pb-28 md:pb-36 pt-4 sm:pt-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="راهنمای مسیر" className="flex items-center gap-2 text-xs text-secondary">
        <Link href="/" className="hover:text-brand transition-colors">
          صفحه اصلی
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180 text-secondary/50" />
        <span className="text-brand font-bold">شرایط و مقررات</span>
      </nav>

      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl md:rounded-[36px] bg-gradient-to-br from-brand via-[#2B326B] to-brand text-white p-6 sm:p-10 md:p-12 shadow-xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-xs font-black text-primary">
              <Shield className="w-3.5 h-3.5" />
              <span>سند حقوقی و رسمی</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-xs font-medium text-white/80">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>آخرین به‌روزرسانی: {toPersianDigits("01/07/1405")}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-white tracking-tight">
            شرایط و مقررات استفاده از ملک تودی
          </h1>

          <p className="text-white/80 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
            قرارداد حقوقی الزام‌آور میان کاربران و پلتفرم ملک تودی جهت تضمین سلامت، شفافیت و امنیت معاملات ملکی.
          </p>
        </div>
      </section>

      {/* Main Content Layout (Sidebar TOC on desktop + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Sidebar: Table of Contents (Desktop Sticky) */}
        <aside className="lg:col-span-4 hidden lg:block sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-soft-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-brand text-sm">
                <FileCheck2 className="w-4 h-4 text-primary" />
                <span>فهرست عناوین و مواد</span>
              </div>
              <span className="text-[11px] font-bold text-secondary bg-soft-bg px-2 py-0.5 rounded-full">
                {toPersianDigits("10")} ماده
              </span>
            </div>

            <div className="space-y-1 text-xs">
              {sectionsList.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2.5 rounded-2xl transition-all text-right font-medium cursor-pointer group",
                    activeSection === sec.id
                      ? "bg-brand text-white font-bold shadow-md shadow-brand/10"
                      : "hover:bg-soft-bg text-secondary hover:text-brand"
                  )}
                >
                  <sec.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      activeSection === sec.id ? "text-primary" : "text-secondary/70 group-hover:text-primary"
                    )}
                  />
                  <span className="truncate flex-1">{sec.title}</span>
                  <ChevronLeft
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      activeSection === sec.id ? "text-primary" : "text-secondary/40 group-hover:translate-x-[-2px]"
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Support Box in Sidebar */}
            <div className="pt-3 border-t border-soft-border space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-brand">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>نیاز به راهنمایی بیشتر دارید؟</span>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed">
                  تیم پشتیبانی ملک تودی همه‌روزه از ساعت ۸ صبح تا ۹ شب پاسخگوی پرسش‌های شماست.
                </p>
                <a
                  href="tel:02191003417"
                  dir="ltr"
                  className="inline-flex items-center justify-center gap-2 w-full bg-brand text-white font-black text-xs py-2 px-3 rounded-xl hover:bg-brand/90 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{toPersianDigits("02191003417")}</span>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <main className="lg:col-span-8 space-y-6">
          {/* Quick jump menu for mobile/tablet */}
          <div className="lg:hidden bg-white p-4 rounded-2xl border border-soft-border shadow-sm space-y-2">
            <span className="text-xs font-bold text-brand block mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              <span>دسترسی سریع به بخش‌ها:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sectionsList.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className="text-[11px] bg-soft-bg hover:bg-primary/10 hover:text-primary text-secondary px-2.5 py-1.5 rounded-xl transition-all font-medium"
                >
                  {sec.title}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Intro */}
          <section
            id="intro"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                مقدمه و توافق‌نامه حقوقی
              </h2>
            </div>

            <div className="space-y-4 text-secondary text-xs sm:text-sm leading-loose text-justify font-normal">
              <p className="text-brand font-bold text-sm sm:text-base">
                به ملک تودی خوش آمدید.
              </p>
              <p>
                سند «شرایط و مقررات استفاده از ملک تودی» یک قرارداد حقوقی الزام‌آور میان شما (کاربر) و ما (ملک تودی) است. با ایجاد حساب کاربری در پلتفرم ملک تودی یا هرگونه دسترسی و استفاده از این پلتفرم و خدمات و ابزارهای آن (از جمله جست‌وجو و مشاهده‌ی آگهی‌ها) شما کاربر ملک تودی محسوب شده و پذیرش خود را نسبت به این شرایط استفاده اعلام می‌کنید.
              </p>
              <p>
                در نتیجه، هرگونه استفاده از پلتفرم ملک تودی دلالت بر موافقت شما با مفاد این سند دارد و ادامه‌ی استفاده‌ی شما از پلتفرم نیز به منزله‌ی پذیرش تغییرات آن است. از این رو، خواهشمندیم با وجود طولانی بودن، پیش از فعالیت در پلتفرم ملک تودی آن را به دقت مطالعه کنید. ما از حضور شما در ملک تودی خرسندیم و همواره در تلاشیم تا تجربه کاربری خوشایندی برای شما رقم بزنیم.
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <span className="font-bold block">تاریخ و نحوه اجرای مقررات:</span>
                  <p className="leading-relaxed">
                    این سند آخرین بار در تاریخ{" "}
                    <strong className="font-black text-brand">{toPersianDigits("01/07/1405")}</strong>{" "}
                    به‌روزرسانی شده است و مفاد آن برای کاربران کنونی از تاریخ{" "}
                    <strong className="font-black text-brand">{toPersianDigits("01/07/1405")}</strong>{" "}
                    و برای کاربران جدید از زمان استفاده از ملک تودی، لازم‌الاجرا خواهد بود.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Article 1 */}
          <section
            id="article-1"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۱- معرفی ملک تودی
              </h2>
            </div>

            <div className="space-y-4 text-secondary text-xs sm:text-sm leading-loose text-justify">
              <p>
                پلتفرم ملک تودی، شامل سایت با دامنه‌ی{" "}
                <span className="font-bold text-brand" dir="ltr">melktoday.ir</span> و{" "}
                <span className="font-bold text-brand" dir="ltr">melktoday.co</span> و برنامه‌های کاربردی موبایل برای سیستم‌عامل‌های Android و iOS محصول{" "}
                <strong className="text-brand font-black">«شرکت بهین کاشانه امروز»</strong> به شماره ثبت{" "}
                <strong className="text-brand font-black">{toPersianDigits("633880")}</strong> است.
              </p>
              <p>
                این پلتفرم به عنوان یک واسط الکترونیکی و مجازی، و در تطابق با بند «ب» ماده ۱ «آیین‌نامه جمع‌آوری و استنادپذیری ادله الکترونیکی مصوب ۱۳۹۳»، به عنوان{" "}
                <strong className="text-brand font-bold">«ارائه‌دهنده خدمات معاملات ملکی و املاک»</strong>{" "}
                شناخته می‌شود. بدین معنا که صرفاً بستری برخط برای انتشار آگهی‌های کاربران و تسهیل برقراری ارتباط میان خریداران، فروشندگان و ارائه‌دهندگان فراهم می‌کند.
              </p>

              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-blue-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>نقش پلتفرم و استقلال معاملات</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-blue-900/90">
                  کاربران محتوای آگهی‌های خود را شخصاً ایجاد و منتشر می‌کنند و مسئولیت ملک تودی محدود به ارائه‌ی فضا در سامانه‌ی رایانه‌ای خود بوده و زیرساخت میزبانی، جست‌وجو و خدمات تکمیلی مرتبط را فراهم می‌سازد. در نتیجه، مسئولیت محتوا و اطلاعات درج شده در هر آگهی با کاربری است که آن را منتشر کرده است و هرگونه معامله یا قراردادی که در نتیجه انتشار آگهی‌ها میان کاربران منعقد می‌شود، مستقیماً بین همان کاربران است؛ ملک تودی هیچ‌گونه نفعی در معاملات ندارد و طرف قرارداد، نماینده، کارگزار یا ضامن هیچ‌یک از طرفین این معاملات نیست.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Article 2 */}
          <section
            id="article-2"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۲- شرایط عمومی استفاده از ملک تودی
              </h2>
            </div>

            <div className="space-y-4 text-secondary text-xs sm:text-sm leading-loose text-justify">
              {/* Point 1 */}
              <div className="space-y-2">
                <h3 className="font-bold text-brand text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">
                    {toPersianDigits("1")}
                  </span>
                  <span>ثبت‌نام و امنیت حساب کاربری</span>
                </h3>
                <p>
                  دسترسی و استفاده از قابلیت‌های پلتفرم ملک تودی از جمله ثبت آگهی، مشاهده اطلاعات تماس و ارتباط با آگهی‌گذار، مستلزم ثبت شماره تلفن همراه متعلق به کاربر و ایجاد حساب کاربری است. کد تأیید (OTP) لازم جهت فعال‌سازی حساب کاربری از طریق پیامک یا تماس تلفنی به اطلاع کاربر خواهد رسید.
                </p>
                <p>
                  مسئولیت حفظ امنیت اطلاعات حساب کاربری و کد تایید بر عهده کاربر است و کلیه فعالیت‌های انجام‌شده با حساب کاربری هر شخص به او منتسب خواهد شد. بنابراین، توصیه می‌کنیم کاربران در صورت سوءاستفاده یا دسترسی غیر مجاز، ابتدا با مراجعه به بخش{" "}
                  <strong className="text-brand font-bold">«دستگاه‌های فعال»</strong> در منوی{" "}
                  <strong className="text-brand font-bold">«ملک تودی من»</strong> در اپلیکیشن، نسبت به حذف دستگاه‌های ناشناس اقدام نمایند و در صورت عدم امکان انجام این فرایند، فوراً ملک تودی را مطلع کنند. همچنین، استفاده از خدمات ملک تودی برای اتباع خارجی، منوط به رعایت قوانین و مقررات جاری کشور و مطابق با شرایط اختصاصی مندرج در سند «آشنایی با روش‌های تایید هویت اتباع خارجی در ملک تودی» است.
                </p>
              </div>

              {/* Point 2 */}
              <div className="space-y-2 pt-2 border-t border-soft-border">
                <h3 className="font-bold text-brand text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">
                    {toPersianDigits("2")}
                  </span>
                  <span>انطباق شماره همراه با کد ملی</span>
                </h3>
                <p>
                  جهت ثبت آگهی، ضروری است حساب کاربری هر شخص با استفاده از شماره تلفن همراهی ایجاد شده باشد که مالکیت آن متعلق به او بوده و با کد ملی فرد انطباق داشته باشد. در صورت عدم انطباق، امکان استفاده از خدمات ملک تودی وجود ندارد. این شرط، برای تمامی فعالیت‌هایی که مستلزم احراز هویت اولیه هستند، الزامی است. ملک تودی می‌تواند برای احراز این انطباق از سرویس‌های استعلام و یا مدارک تکمیلی استفاده کند.
                </p>
              </div>

              {/* Point 3 */}
              <div className="space-y-2 pt-2 border-t border-soft-border">
                <h3 className="font-bold text-brand text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">
                    {toPersianDigits("3")}
                  </span>
                  <span>صاحبان دفاتر و آژانس‌های املاک</span>
                </h3>
                <p>
                  صاحبان دفاتر املاک جهت مدیریت بهینه‌تر فعالیت‌های خود، می‌توانند از امتیازات موجود در پلتفرم استفاده کنند. احراز هویت اولیه در این بخش بر مبنای انطباق شماره تلفن همراه با کد ملی است؛ با این حال، ملک تودی مجاز است در هر زمان و حسب صلاحدید یا الزامات قانونی، مدارک تکمیلی (نظیر پروانه کسب، مدرک نمایندگی و نشانی کسب‌وکار) را از کاربر مطالبه نماید و تا زمان احراز صحت مدارک، حق تعلیق موقت حساب مذکور را خواهد داشت.
                </p>
              </div>

              {/* Point 4 */}
              <div className="space-y-2.5 pt-2 border-t border-soft-border">
                <h3 className="font-bold text-brand text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">
                    {toPersianDigits("4")}
                  </span>
                  <span>شرایط الزامی فعالیت در پلتفرم</span>
                </h3>
                <p>هرگونه فعالیت در پلتفرم ملک تودی، منوط به رعایت شرایط ذیل است:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-soft-bg border border-soft-border flex items-start gap-2">
                    <span className="font-black text-primary text-xs shrink-0">الف)</span>
                    <span className="text-xs text-brand font-medium">
                      داشتن ۱۸ سال تمام. فعالیت افراد زیر ۱۸ سال تنها با نظارت و مسئولیت والدین یا قیم قانونی مجاز است.
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-soft-bg border border-soft-border flex items-start gap-2">
                    <span className="font-black text-primary text-xs shrink-0">ب)</span>
                    <span className="text-xs text-brand font-medium">
                      انطباق کامل فعالیت‌ها و محتوا با کلیه قوانین جاری کشور، آیین‌نامه‌ها، مصوبات و دستورات مقامات قضایی.
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-soft-bg border border-soft-border flex items-start gap-2">
                    <span className="font-black text-primary text-xs shrink-0">پ)</span>
                    <span className="text-xs text-brand font-medium">
                      رعایت تمام مفاد شرایط استفاده و سایر سیاست‌ها (از جمله فعالیت‌های غیر مجاز و حریم خصوصی).
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-soft-bg border border-soft-border flex items-start gap-2">
                    <span className="font-black text-primary text-xs shrink-0">ت)</span>
                    <span className="text-xs text-brand font-medium">
                      استفاده از زبان رسمی فارسی برای انتشار هرگونه محتوا و آگهی در پلتفرم.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Article 3 */}
          <section
            id="article-3"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۳- سیاست‌های سایت و اپلیکیشن ملک تودی
              </h2>
            </div>

            <p className="text-secondary text-xs sm:text-sm leading-relaxed text-justify">
              کاربر متعهد به رعایت سیاست‌های اعلامی ملک تودی در این ماده است. ملک تودی مجاز است به منظور اجرای سیاست‌های ذیل با استفاده از ابزارها و روش‌های مختلف (از جمله سیستم‌های ماشینی و نظارت انسانی) بر محتوای آگهی‌های کاربران قبل و بعد از انتشار نظارت نماید. انتشار آگهی، عکس، ویدئو یا هرگونه محتوای خلاف این سیاست‌ها ممنوع و منجر به عدم تایید یا حذف آگهی و در صورت تکرار ایجاد محدودیت موقت یا دائم برای فعالیت کاربر در پلتفرم ملک تودی خواهد شد. در صورت نقض این تعهدات، مسئولیت کامل کیفری و مدنی ناشی از نقض بر عهده کاربر متخلف خواهد بود.
            </p>

            {/* Subsection 1: Ad policies */}
            <div className="p-5 rounded-2xl bg-soft-bg border border-soft-border space-y-3">
              <h3 className="font-black text-brand text-xs sm:text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>۱) سیاست‌های انتشار آگهی</span>
              </h3>
              <p className="text-xs text-secondary">
                برای انتشار آگهی کاربر می‌بایست سیاست‌های ملک تودی را که شامل و نه محدود به این موارد است، رعایت نماید:
              </p>
              <ul className="space-y-2 text-xs text-brand font-medium pr-2">
                {[
                  "عدم انتشار آگهی تکراری",
                  "عدم انتشار آگهی در دسته‌بندی نادرست",
                  "عدم انتشار بیش از یک مورد در هر آگهی",
                  "عدم انتشار آگهی درخواست",
                  "عدم انتشار هرگونه اطلاعات غیر واقعی",
                  "عدم انتخاب موقعیت مکانی غلط یا غیر مرتبط با موضوع آگهی",
                  "عدم انتشار هرگونه آگهی که محتوای آن به هر نحو بر اساس قوانین و مقررات یا به تشخیص نهادهای ذیصلاح قانونی، موقتاً یا دائماً دارای محدودیت یا ممنوعیت قانونی باشد.",
                  "عدم انتشار هرگونه محتوا که شامل عباراتی غیر مرتبط با موضوع آگهی بوده و یا دارای مضمون مستهجن، مبتذل، موهن و غیر اخلاقی، نامتعارف، نادرست، مبهم، گمراه‌کننده، تبعیض‌آمیز، توهین‌آمیز یا ناقض حقوق اشخاص به ویژه گروه‌های آسیب‌پذیر باشد.",
                  "عدم انتشار هرگونه آگهی که شامل محتوای خبری یا تبلیغاتی با موضوعات سیاسی، اجتماعی، مذهبی یا دعوت به تجمع و کمپین باشد یا هرگونه محتوای مجرمانه از قبیل توهین، نشر اکاذیب، افترا یا هرگونه محتوایی که منجر به اخلال در آرامش جامعه و نقض حقوق مادی و معنوی اشخاص ثالث یا تعرض به اموال و دارایی‌های آنان شود.",
                  "عدم انتشار هرگونه آگهی که ناقض حقوق مالکیت فکری ملک تودی یا اشخاص ثالث باشد.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Subsection 2: Photo and Video */}
            <div className="p-5 rounded-2xl bg-soft-bg border border-soft-border space-y-3">
              <h3 className="font-black text-brand text-xs sm:text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>۲) سیاست‌های انتشار عکس و ویدئو</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                کاربران مسئول محتوای عکس‌ها و ویدئوهای آگهی‌های خود هستند و موظفند با رعایت قوانین و مقررات جاری کشور و با حفظ حقوق اشخاص ثالث، اقدام به انتشار نمایند. در صورت استفاده از عکس یا ویدئو، باید از محتوای واقعی، باکیفیت و مرتبط با موضوع آگهی استفاده شود. چنانچه هر یک از موارد زیر رعایت نشود، ملک تودی حق حذف آگهی و یا عدم نمایش تصویر و ویدئو را خواهد داشت:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-brand font-medium">
                {[
                  "تصاویر یا ویدئوهای فاقد کیفیت مناسب یا دارای ابعاد نامناسب",
                  "استفاده از تصاویر یا ویدئوهای نامرتبط با موضوع آگهی",
                  "استفاده از تصاویر یا ویدئوهای غیر واقعی",
                  "استفاده از تصاویر یا ویدئوهای متعلق به آگهی‌های دیگر در پلتفرم ملک تودی",
                  "تصاویر یا ویدئوهای نیازمند چرخش یا اصلاح جهت",
                  "تصاویر یا ویدئوهای مربوط به کالاها و خدمات غیر مجاز",
                  "تصاویر یا ویدئوهای مغایر با عرف جامعه یا قوانین جاری کشور",
                  "استفاده ابزاری از تصاویر یا ویدئوهای اشخاص یا انتشار بدون رضایت ایشان",
                  "نمایش شماره تماس، ایمیل، آدرس وب‌سایت یا شبکه‌های اجتماعی یا QR Code در تصویر یا ویدئو",
                  "تصاویر یا ویدئوهای حاوی متن، توضیحات، نام کسب‌وکار یا هرگونه عبارت تبلیغاتی",
                  "هرگونه محتوای تصویری مغایر با حقوق مالکیت فکری ملک تودی یا اشخاص ثالث",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-soft-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-error mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsection 3: Chat policies */}
            <div className="p-5 rounded-2xl bg-soft-bg border border-soft-border space-y-3">
              <h3 className="font-black text-brand text-xs sm:text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>۳) سیاست‌های چت در ملک تودی</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                قابلیت چت پلتفرم ملک تودی، با هدف تسهیل ارتباط آگهی‌گذار و آگهی‌بیننده در راستای انجام معاملات، طراحی شده است. هرگونه استفاده از این قابلیت، به‌منزله پذیرش شرایط ذیل است:
              </p>
              <div className="space-y-2 text-xs text-brand font-medium pr-1">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">الف)</span>
                  <span>استفاده از فضای چت صرفاً برای گفتگوهای مرتبط با موارد و خدمات درج‌شده در آگهی مجاز است و هرگونه استفاده برای مقاصد دیگر (ارتباطات شخصی، سیاسی، اجتماعی و...) ممنوع است.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">ب)</span>
                  <span>ملک تودی مجاز است به منظور تأمین امنیت پلتفرم، شناسایی متخلفین و پیشگیری از مزاحمت یا کلاهبرداری، با سیستم‌های ماشینی و نظارت انسانی بر محتوای مکالمات نظارت نماید.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">پ)</span>
                  <span>ارسال پیام‌های نامرتبط، توهین‌آمیز، غیراخلاقی، تبلیغاتی یا مغایر با قوانین ممنوع بوده و در صورت احراز تخلف، محدودیت‌های لازم نسبت به حساب کاربری متخلف اعمال خواهد شد.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">ت)</span>
                  <span>رعایت قوانین از جمله ممنوعیت مزاحمت، توهین، فحاشی، افترا و نشر اکاذیب الزامی است و مسئولیت کامل بر عهده کاربر متخلف خواهد بود و ملک تودی حق مسدودسازی و پیگیری قضایی را دارد.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">ث)</span>
                  <span>در مواردی که مراجع ذیصلاح قانونی اطلاعات مربوط به مکالمات را استعلام نمایند، ملک تودی در حدود وظایف قانونی خود اطلاعات لازم را در اختیار ایشان قرار خواهد داد.</span>
                </div>
              </div>
            </div>

            {/* Subsection 4: Anti-fraud and Harassment */}
            <div className="p-5 rounded-2xl bg-soft-bg border border-soft-border space-y-3">
              <h3 className="font-black text-brand text-xs sm:text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-status-warning" />
                <span>۴) سیاست‌های مرتبط با کلاهبرداری و مزاحمت</span>
              </h3>
              <div className="space-y-3 text-xs text-secondary leading-relaxed text-justify">
                <p>
                  <strong className="text-brand font-bold">الف)</strong> مسئولیت احراز هویت طرف مقابل و اطمینان از صحت و سلامت معامله و شرایط قرارداد، به‌طور کامل بر عهده کاربر است. ملک تودی هیچ‌گونه مسئولیتی در قبال صحت‌سنجی معاملات ندارد، با این حال در راستای مقابله با کلاهبرداری یا سایر اقدامات غیر قانونی، در صورت احراز تخلف، نسبت به محدودسازی یا مسدود نمودن متخلفین اقدام می‌نماید و در صورت دستور مقامات قضایی یا ظن قوی بر فعالیت مجرمانه، گزارش تخلف را به مراجع ذیصلاح ارسال خواهد کرد.
                </p>
                <p>
                  <strong className="text-brand font-bold">ب)</strong> ملک تودی در راستای صیانت از امنیت پلتفرم، چنانچه بر اساس پایش‌های هوشمند یا گزارش‌های آگهی، فعالیت‌های یک کاربر را مشکوک تشخیص دهد، مجاز است به منظور پیشگیری از ورود خسارت به کاربران، نسبت به صدور هشدارهای مراقبتی یا اطلاع‌رسانی به کاربرانی که با فرد مذکور در ارتباط بوده‌اند اقدام نماید. صدور یا عدم صدور این هشدارها تضمین‌کننده‌ی امنیت نهایی معاملات نبوده و مسئولیتی را متوجه ملک تودی نخواهد کرد.
                </p>
              </div>
            </div>

            {/* Subsection 5: Fees and Services */}
            <div className="p-5 rounded-2xl bg-soft-bg border border-soft-border space-y-2">
              <h3 className="font-black text-brand text-xs sm:text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-primary" />
                <span>۵) سیاست‌های مربوط به هزینه‌ها و خدمات</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                ارسال آگهی برای کاربران تا تعداد مشخصی رایگان است. بدیهی است برای ارسال آگهی مازاد بر تعداد مشخص‌شده، پرداخت هزینه الزامی است. همچنین، استفاده از خدمات ویژه ملک تودی برای افزایش بازدید آگهی‌ها (مانند نردبان، فوری و پکیج‌های ارتقا)، مشمول تعرفه‌های مصوب خواهد بود.
              </p>
            </div>
          </section>

          {/* Section: Article 4 */}
          <section
            id="article-4"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۴- حقوق و مسئولیت‌های ملک تودی
              </h2>
            </div>

            <div className="space-y-3.5 text-secondary text-xs sm:text-sm leading-loose text-justify">
              {[
                {
                  num: "۱",
                  title: "خدمات میزبانی و عدم مداخله",
                  text: "ملک تودی در مقام «ارائه‌دهنده خدمات میزبانی»، صرفاً زیرساخت لازم جهت انتشار آگهی را فراهم نموده و با توجه به انتشار خودکار و مستقیم محتوای آگهی‌ها توسط کاربران، هیچ‌گونه نقش و مداخله‌ای در تولید، انتخاب یا ماهیت محتوای آگهی‌ها ندارد. نظارت ملک تودی بر آگهی‌ها صرفاً جنبه‌ی انطباق با قوانین را داشته و به معنای تایید صحت ادعای آگهی‌دهنده نیست.",
                },
                {
                  num: "۲",
                  title: "استقلال معاملات و لزوم راستی‌آزمایی",
                  text: "استفاده از پلتفرم ملک تودی به منزله‌ی پذیرش این امر است که ملک تودی طرف هیچ معامله‌ای فیمابین کاربران نیست و صرفاً فضایی را در سامانه رایانه‌ای خود برای انتشار آگهی‌ها در اختیار کاربران قرار می‌دهد. کاربران پیش از هرگونه اقدام، معامله یا ارتباط با کاربران دیگر، باید محتوای آگهی‌ها و مکالمات را شخصاً راستی‌آزمایی نموده و با مسئولیت خود اقدام نمایند. ملک تودی هیچ‌گونه مسئولیتی در قبال اقدامات، تقصیرات و تخلفات سایر کاربران ندارد.",
                },
                {
                  num: "۳",
                  title: "سلب تضمین اصالت و کیفیت",
                  text: "تمام محتویات آگهی از جمله متن، قیمت و تصاویر توسط کاربران ارائه می‌شود. ملک تودی هیچ‌گونه تضمینی در خصوص کیفیت، امنیت، سلامت، اصالت، قانونی بودن و یا صحت ادعاهای کاربر ارائه نمی‌دهد. انتشار آگهی به هیچ عنوان به معنای قبول تضمین یا توصیه‌ی آن توسط ملک تودی نبوده و طرفین معامله مسئولیت صحت‌سنجی اطلاعات را برعهده دارند.",
                },
                {
                  num: "۴",
                  title: "خدمات اشخاص ثالث در فروشگاه ابزارها",
                  text: "خدماتی از قبیل سرویس‌های پرداخت، کارشناسی، حمل‌ونقل و احراز مجوز که توسط شرکت‌های دیگر در قالب ابزارهای موجود در «فروشگاه ابزارها» ارائه می‌شوند، مستقل از ملک تودی بوده و توسط شرکت‌های صاحب آن ابزار مدیریت می‌شوند. ملک تودی هیچ‌گونه مسئولیتی در قبال کیفیت و نحوه ارائه خدمات این سرویس‌دهندگان ندارد.",
                },
                {
                  num: "۵",
                  title: "ملاقات‌های حضوری و تعامل فیزیکی",
                  text: "هرگونه ملاقات حضوری و تعامل فیزیکی میان کاربران خارج از بستر فنی و زیرساخت‌های الکترونیک پلتفرم ملک تودی صورت می‌گیرد. بنابراین، ملک تودی هیچ‌گونه نظارت، کنترل یا مسئولیتی بر سلامت، ایمنی و عواقب ناشی از تعاملات مستقیم کاربران نداشته و مسئولیت هرگونه خسارت بدنی، جانی یا مالی بر عهده شخص مرتکب است.",
                },
                {
                  num: "۶",
                  title: "درگاه‌های بانکی و پرداخت اینترنتی",
                  text: "مشکلات احتمالی استفاده از درگاه‌های پرداخت اینترنتی از جمله قطع سرویس و اختلال در درگاه‌های پرداخت بانک‌ها، از حوزه‌ی مسئولیت ملک تودی خارج بوده و در قبال آن‌ها مسئولیتی نخواهد داشت.",
                },
                {
                  num: "۷",
                  title: "سلب مسئولیت از زیان‌های تجاری",
                  text: "ملک تودی هیچ‌گونه مسئولیتی در قبال زیان‌های تجاری کاربران (نظیر از دست دادن سود، درآمد، تولید و فرصت‌های تجاری) نخواهد داشت.",
                },
                {
                  num: "۸",
                  title: "موارد غیرقابل پیش‌بینی و فورس ماژور",
                  text: "ملک تودی هیچ‌گونه مسئولیتی در قبال اختلال موقت یا دائم در ارائه خدمات ناشی از عوامل فنی غیر قابل پیش‌بینی (نظیر هک شدن یا مشکلات زیرساختی) یا عوامل خارج از کنترل (نظیر قطع اینترنت کشور یا دستور مراجع ذیصلاح) نخواهد داشت. در مواردی که به موجب تقصیر ملک تودی که در مراجع صالح به اثبات رسیده باشد، مسئولیت جبران خسارت تا سقف دو برابر هزینه‌ی پرداختی انتشار همان آگهی است.",
                },
                {
                  num: "۹",
                  title: "حق مسدودسازی و عدم استرداد وجه",
                  text: "در صورت نقض هر یک از شرایط و مقررات استفاده از جمله درج آگهی تکراری، غیرواقعی بودن آگهی، مزاحمت یا کلاهبرداری، ملک تودی حق مسدودسازی حساب کاربری، حذف آگهی، محدود کردن نمایش آگهی و عدم استرداد وجه پرداختی را خواهد داشت.",
                },
                {
                  num: "۱۰",
                  title: "عدم ایجاد رابطه نمایندگی یا استخدام",
                  text: "ایجاد حساب کاربری در پلتفرم ملک تودی، جهت ارائه‌ی خدمات، به هیچ وجه موجب ایجاد رابطه‌ای از قبیل نمایندگی، مشارکت، استخدام، پیمانکاری یا نظایر آن میان کاربر و ملک تودی نخواهد شد.",
                },
                {
                  num: "۱۱",
                  title: "خوداظهاری عناوین و مجوزها",
                  text: "عناوین انتخابی کاربران مانند فروشگاه، نمایشگاه، آژانس املاک یا مشاور، صرفاً بر مبنای خوداظهاری کاربران است و مسئولیت انطباق این موارد با پروانه‌های کسب بر عهده خود کاربران است و به معنای تأیید هویت یا کیفیت خدمات آن کسب‌وکار توسط ملک تودی نیست.",
                },
                {
                  num: "۱۲",
                  title: "استفاده از هوش مصنوعی در پلتفرم",
                  text: "ملک تودی به منظور ارتقای تجربه کاربری، شناسایی تخلفات، بهینه‌سازی جست‌وجو، نظارت بر محتوا و افزایش امنیت، از فناوری‌های مبتنی بر هوش مصنوعی استفاده می‌کند. کاربر می‌پذیرد که پردازش‌های ماشینی و الگوریتم‌های هوش مصنوعی علیرغم دقت بالا، همواره با احتمال خطا همراه بوده و ملک تودی تضمین صددرصدی در خصوص خروجی این فرایندها ارائه نمی‌دهد.",
                },
                {
                  num: "۱۳",
                  title: "دستیار هوشمند «ملک یار»",
                  text: "قابلیت ملک یار ابزاری مبتنی بر هوش مصنوعی است که جهت راهنمایی کاربران ارائه شده است. خروجی‌های این ابزار صرفاً جنبه پیشنهادی داشته و به هیچ وجه توصیه حقوقی، مالی یا کارشناسی محسوب نمی‌شود. مسئولیت نهایی تصمیم‌گیری و راستی‌آزمایی بر عهده کاربران است.",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-soft-bg border border-soft-border space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand text-white text-xs font-black flex items-center justify-center shrink-0">
                      {toPersianDigits(item.num)}
                    </span>
                    <h3 className="font-black text-brand text-xs sm:text-sm">{item.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-secondary leading-relaxed pr-8">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Article 5 */}
          <section
            id="article-5"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۵- حقوق و مسئولیت‌های کاربر
              </h2>
            </div>

            <div className="space-y-3.5 text-secondary text-xs sm:text-sm leading-loose text-justify">
              {[
                {
                  num: "۱",
                  title: "پرهیز از اقدامات مخرب و استخراج داده",
                  text: "کاربر متعهد است از هرگونه فعالیتی که موجب خدشه‌دار شدن اعتبار، نقض مقررات یا زیرساخت‌های فنی پلتفرم ملک تودی شود (از جمله انتشار آگهی با اهداف مجرمانه، استفاده از ربات یا تلاش برای استخراج داده‌ها) خودداری نماید.",
                },
                {
                  num: "۲",
                  title: "حفظ محرمانگی اطلاعات ورود (OTP)",
                  text: "کاربر مسئولیت حفظ محرمانگی اطلاعات مرتبط با حساب کاربری خود، به‌ویژه کد ورود یک‌بار مصرف را بر عهده دارد. افشای این اطلاعات مسئولیت هرگونه سوءاستفاده احتمالی را متوجه خود کاربر می‌سازد.",
                },
                {
                  num: "۳",
                  title: "مقاصد مجاز و تبادل متعارف ملکی",
                  text: "استفاده از پلتفرم ملک تودی صرفاً جهت تبادل کالا و خدمات و مقاصد متعارف خرید و فروش مجاز است. هرگونه فعالیت با اهداف سیاسی، اجتماعی، مذهبی یا هر هدف دیگری مغایر با ماهیت خدمات ملک تودی، اکیداً ممنوع است.",
                },
                {
                  num: "۴",
                  title: "مجوز بهره‌برداری ۳ ساله از محتوا",
                  text: "با انتشار هرگونه آگهی، کاربر به ملک تودی یک مجوز بهره‌برداری انحصاری، قابل واگذاری و غیر قابل فسخ برای مدت سه سال از زمان انتشار اعطا می‌کند تا از کلیه اجزا و محتوای آگهی برای میزبانی، نمایش، انتشار، توزیع، ویرایش جهت انطباق با قوانین و بهبود خدمات استفاده نماید.",
                },
                {
                  num: "۵",
                  title: "اعطای نمایندگی برای پیگیری حقوقی ناقضین",
                  text: "کاربر به ملک تودی نمایندگی و وکالت می‌دهد تا در صورت سوءاستفاده اشخاص ثالث از زیرساخت‌ها یا استخراج غیر مجاز محتوای آگهی‌ها، بتواند به نمایندگی از کاربر نیز علیه ناقضین حقوق در مراجع قضایی اقدام نماید.",
                },
                {
                  num: "۶",
                  title: "بررسی و کارشناسی آگهی‌ها",
                  text: "کاربر می‌پذیرد که ارائه‌دهندگان خدمات در ملک تودی مجازند طبق ضوابط بر روی آگهی وی بررسی یا کارشناسی انجام دهند. مسئولیت صحت این گزارش‌ها بر عهده شخص ارائه‌دهنده خدمت است.",
                },
                {
                  num: "۷",
                  title: "حساب‌های «ملک تودی حرفه‌ای» و مسئولیت تضامنی",
                  text: "صاحب حساب «ملک تودی حرفه‌ای» می‌تواند افراد دیگری را با عناوین «مدیر» یا «دستیار» اضافه نماید. مسئولیت هرگونه تخلف در آگهی‌ها به صورت تضامنی با فرد متخلف و صاحب حساب خواهد بود.",
                },
                {
                  num: "۸",
                  title: "نام و برند حساب «تودی پرو»",
                  text: "صاحب حساب «تودی پرو» ملزم به انتخاب نام و عنوان مناسب بوده و از انتخاب نام‌های مغایر قانون یا ناقض علائم تجاری دیگران منع شده است.",
                },
                {
                  num: "۹",
                  title: "استفاده صحیح از ابزار «ملک یار»",
                  text: "کاربر می‌پذیرد از ملک یار منحصراً به منظور دریافت راهنمایی ملکی استفاده نماید و از مکالمات نامرتبط یا سوءاستفاده پرهیز کند.",
                },
                {
                  num: "۱۰",
                  title: "عدم ارائه اطلاعات هویتی و حساس به هوش مصنوعی",
                  text: "کاربر متعهد است از ارائه هرگونه اطلاعات حساس یا شخصی به دستیار ملک یار پرهیز نماید و عواقب ناشی از آن متوجه کاربر خواهد بود.",
                },
                {
                  num: "۱۱",
                  title: "رعایت احترام به کادر پشتیبانی و کارکنان",
                  text: "کاربر متعهد به رعایت احترام در تمامی تعاملات با پشتیبانی است. هرگونه توهین، فحاشی یا تهدید منجر به قطع ارتباط، مسدودسازی دائم حساب و پیگیری قانونی خواهد شد.",
                },
                {
                  num: "۱۲",
                  title: "بررسی دوره‌ای مقررات",
                  text: "مسئولیت بررسی دوره‌ای این سند بر عهده کاربر است و نسخه‌ی موجود بر روی سایت و اپلیکیشن همواره نسخه‌ی حاکم محسوب می‌شود.",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-soft-bg border border-soft-border space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/20 text-brand text-xs font-black flex items-center justify-center shrink-0">
                      {toPersianDigits(item.num)}
                    </span>
                    <h3 className="font-black text-brand text-xs sm:text-sm">{item.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-secondary leading-relaxed pr-8">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Article 6 */}
          <section
            id="article-6"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۶- ضمانت‌اجرای تخلف از تعهدات
              </h2>
            </div>

            <div className="space-y-4 text-secondary text-xs sm:text-sm leading-loose text-justify">
              <p>
                <strong className="text-brand font-bold">۱) حذف یک‌جانبه و عدم استرداد وجه:</strong> چنانچه آگهی منتشرشده با قوانین کشور، دستورات مراجع صالح و ضوابط اختصاصی ملک تودی مغایرت داشته باشد، پلتفرم به صورت یک‌جانبه اقدام به حذف آگهی، عدم نمایش یا جابه‌جایی دسته‌بندی نموده و وجه پرداختی غیر قابل استرداد خواهد بود.
              </p>
              <p>
                <strong className="text-brand font-bold">۲) مسدودسازی حساب:</strong> در صورت ایجاد مزاحمت، تلاش برای کلاهبرداری یا به مخاطره انداختن امنیت پلتفرم، حساب کاربری متخلف به صورت موقت یا دائم مسدود می‌شود.
              </p>

              {/* Prohibited tech tools */}
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-950 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-red-900">
                  <AlertTriangle className="w-4 h-4 text-status-error shrink-0" />
                  <span>۳) ممنوعیت استفاده از ابزارهای ماشینی، اسکرپینگ و مهندسی معکوس</span>
                </div>
                <p className="text-xs leading-relaxed text-red-900/90">
                  هرگونه سوءاستفاده یا استفاده غیر متعارف از پلتفرم ملک تودی شامل و نه محدود به موارد زیر ممنوع بوده و علاوه بر مسدودسازی فوری، پیگیری کیفری و حقوقی در پی خواهد داشت:
                </p>
                <ul className="space-y-1.5 text-xs text-red-950 font-medium pr-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-error mt-1.5 shrink-0" />
                    <span>استفاده از ربات‌ها، اسکریپرها، کراولرها، اسکریپت‌ها یا عامل‌های هوش مصنوعی جهت استخراج اطلاعات یا داده</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-error mt-1.5 shrink-0" />
                    <span>استفاده از روش‌های خودکار جهت ثبت اطلاعات و ارسال یا ویرایش آگهی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-error mt-1.5 shrink-0" />
                    <span>فعالیت سازمان‌یافته انسانی جهت استخراج اطلاعات و داده</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-error mt-1.5 shrink-0" />
                    <span>دسترسی غیرمجاز به زیرساخت‌ها، سرورها و پایگاه‌های داده خارج از رابط کاربری رسمی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-error mt-1.5 shrink-0" />
                    <span>تلاش برای مهندسی معکوس، شنود داده (Decompiling) یا دور زدن پروتکل‌های ارتباطی پلتفرم</span>
                  </li>
                </ul>
              </div>

              {/* Damage models */}
              <div className="space-y-2.5 pt-2">
                <h3 className="font-bold text-brand text-xs sm:text-sm">
                  ۴) مبانی کارشناسی محاسبه خسارات مادی و معنوی:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-soft-bg border border-soft-border space-y-1">
                    <span className="font-black text-brand block">الف) خسارت به اعتبار برند:</span>
                    <span className="text-secondary leading-relaxed">
                      معادل نسبتی از ارزش نام تجاری بر مبنای آخرین گزارش‌های ارزیابی برند، هزینه‌های جذب و ریزش کاربران.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-soft-bg border border-soft-border space-y-1">
                    <span className="font-black text-brand block">ب) خسارت ناشی از افت درآمد:</span>
                    <span className="text-secondary leading-relaxed">
                      معادل کاهش درآمد ناخالص پلتفرم در دسته‌بندی موضوع تخلف در بازه زمانی وقوع اختلال.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-soft-bg border border-soft-border space-y-1">
                    <span className="font-black text-brand block">ج) هزینه‌های بازسازی و صیانت:</span>
                    <span className="text-secondary leading-relaxed">
                      جبران کامل نفر-ساعت نیروی انسانی، هزینه‌های حقوقی، وکالت و تجهیزات فنی رفع تخلف.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-soft-bg border border-soft-border space-y-1">
                    <span className="font-black text-brand block">د) ارزش تجاری داده‌ها:</span>
                    <span className="text-secondary leading-relaxed">
                      در صورت استخراج غیر مجاز داده‌ها، ارزش روز داده‌های مشابه در بازار ملاک محاسبه خواهد بود.
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-secondary pt-1">
                <strong className="text-brand font-bold">۵) اسقاط اعتراض:</strong> کاربر با پذیرش این سند، آگاهی خود را از مدل‌های محاسباتی فوق اعلام داشته و حق هرگونه اعتراض به این مبانی را در مرحله کارشناسی یا مراجع قضایی از خود سلب می‌نماید.
              </p>
            </div>
          </section>

          {/* Section: Article 7 */}
          <section
            id="article-7"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۷- مالکیت فکری
              </h2>
            </div>

            <div className="space-y-3 text-secondary text-xs sm:text-sm leading-loose text-justify">
              <p>
                کلیه عناصر مادی و معنوی ملک تودی شامل نرم‌افزارها (نسخه اندروید و iOS)، سورس‌کدها، وب‌سایت، رابط کاربری (UI) و تجربه کاربری (UX)، طرح‌های گرافیکی، متون اختصاصی، ساختار چیدمان آگهی‌ها، علائم تجاری ثبت‌شده به شماره‌های ثبت{" "}
                <strong className="text-brand font-black">{toPersianDigits("256810")}</strong>،{" "}
                <strong className="text-brand font-black">{toPersianDigits("446622")}</strong> و{" "}
                <strong className="text-brand font-black">{toPersianDigits("369808")}</strong> نزد اداره ثبت علائم تجاری و نام‌های دامنه‌های مرتبط با ملک تودی، تماماً و منحصراً متعلق به شرکت{" "}
                <strong className="text-brand font-black">«بهین کاشانه امروز»</strong> (شرکت با مسئولیت محدود) بوده و تحت حمایت‌های قانونی قرار دارد.
              </p>
              <p>
                هرگونه کپی‌برداری، بازنشر محتوا، ایجاد سرویس‌های مشابه، بهره‌برداری از بانک اطلاعاتی یا نام تجاری که موجب گمراهی عموم یا خدشه به برند شود ممنوع بوده و از طریق مراجع قضایی پیگیری خواهد شد.
              </p>
            </div>
          </section>

          {/* Section: Article 8 */}
          <section
            id="article-8"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۸- حفاظت از حریم خصوصی
              </h2>
            </div>

            <div className="space-y-3 text-secondary text-xs sm:text-sm leading-loose text-justify">
              <p>
                اصول و شیوه‌های حفاظت از حریم خصوصی و داده‌های کاربران در پلتفرم ملک تودی، مطابق با قوانین جاری کشور و بر اساس تکلیف قانونی پایش و نگهداری داده‌ها، به تفصیل در سند «سیاست‌نامه حریم خصوصی ملک تودی» شرح داده شده است.
              </p>
              <p>
                استفاده از خدمات ملک تودی به‌منزله‌ی مطالعه و پذیرش کامل مفاد سند مذکور خواهد بود. جهت آگاهی از حقوق خود و جزئیات نحوه پردازش داده‌ها، مطالعه این سند الزامی است.
              </p>
            </div>
          </section>

          {/* Section: Article 9 */}
          <section
            id="article-9"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۹- حل و فصل اختلافات
              </h2>
            </div>

            <div className="space-y-4 text-secondary text-xs sm:text-sm leading-loose text-justify">
              <div className="p-4 rounded-2xl bg-soft-bg border border-soft-border space-y-2">
                <h3 className="font-bold text-brand text-xs sm:text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <span>۱) اختلاف بین کاربر و ملک تودی:</span>
                </h3>
                <p>
                  کاربر مکلف است پیش از هرگونه اقدام قضایی، موضوع را از طریق واحد پشتیبانی پیگیری نموده و در جلسات حل اختلاف همکاری نماید. چنانچه موضوع حداکثر ظرف{" "}
                  <strong className="text-brand font-black">{toPersianDigits("15")} روز</strong> از تاریخ اعلام از طریق مذاکره حل و فصل نگردد، طرفین مختار به پیگیری از طریق مراجع صالح قضایی خواهند بود.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-soft-bg border border-soft-border space-y-2">
                <h3 className="font-bold text-brand text-xs sm:text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>۲) اختلاف بین کاربران با یکدیگر:</span>
                </h3>
                <p>
                  با توجه به ماهیت میزبانی پلتفرم، مسئولیت پیگیری اختلافات ناشی از معاملات مستقیماً بر عهده طرفین بوده و ملک تودی هیچ‌گونه نقش داوری، قضاوت یا نظارت بر اجرای توافقات ندارد و صرفاً در صورت استعلام مراجع قضایی اطلاعات لازم را ارائه خواهد کرد.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Article 10 */}
          <section
            id="article-10"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-primary rounded-full" />
              <h2 className="text-lg sm:text-xl font-black text-brand">
                ماده‌ی ۱۰- ارتباط با ما و سرشماره‌های رسمی
              </h2>
            </div>

            <div className="space-y-4 text-secondary text-xs sm:text-sm leading-loose text-justify">
              <p>
                جهت دسترسی به پرسش‌های متداول و راهنمایی، ابزار هوشمند «ملک یار» و کارشناسان پشتیبانی در دسترس شما هستند. ارتباطات درون پلتفرم منحصراً از طریق قابلیت‌های «پستچی ملک تودی» و «پشتیبان هوشمند» صورت می‌پذیرد.
              </p>

              {/* Phone Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary font-medium block">پشتیبانی تلفنی (۸ الی ۲۱)</span>
                      <a
                        href="tel:02191003417"
                        dir="ltr"
                        className="text-sm sm:text-base font-black text-brand hover:text-primary transition-colors block"
                      >
                        {toPersianDigits("02191003417")}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy("02191003417", "tel-teh", "تلفن پشتیبانی")}
                    className="p-2 rounded-xl bg-white hover:bg-soft-border text-secondary transition-colors"
                  >
                    {copiedKey === "tel-teh" ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-soft-bg border border-soft-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary font-medium block">تلفن همراه و پیام‌رسان</span>
                      <a
                        href="tel:09199173417"
                        dir="ltr"
                        className="text-sm sm:text-base font-black text-brand hover:text-primary transition-colors block"
                      >
                        {toPersianDigits("09199173417")}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy("09199173417", "tel-mob", "تلفن همراه")}
                    className="p-2 rounded-xl bg-white hover:bg-soft-border text-secondary transition-colors"
                  >
                    {copiedKey === "tel-mob" ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* SMS Official Shortcodes */}
              <div className="p-4 rounded-2xl bg-brand text-white space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  <Send className="w-4 h-4 text-primary shrink-0" />
                  <span>سرشماره‌های پیامکی رسمی ملک تودی</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  ملک تودی صرفاً از سرشماره‌های ذیل جهت ارسال پیامک‌های فنی، کد ورود (OTP) و اعلانات استفاده می‌کند و هرگونه پیامک یا تماس با نام ملک تودی از سایر شماره‌ها فاقد اعتبار است:
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {["0930", "0940", "0950"].map((num) => (
                    <span
                      key={num}
                      dir="ltr"
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm font-black text-primary tracking-widest"
                    >
                      {toPersianDigits(num)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA to Explore or Submit */}
          <div className="bg-soft-bg rounded-3xl p-6 border border-soft-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <span className="text-xs text-secondary block">آیا سؤالی درباره این قوانین دارید؟</span>
              <p className="text-sm font-black text-brand">
                کارشناسان حقوقی و پشتیبانی ما آماده پاسخگویی هستند.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/about"
                className="px-4 py-2.5 rounded-xl bg-white border border-soft-border text-xs font-bold text-brand hover:bg-soft-border transition-colors"
              >
                درباره ما
              </Link>
              <Link
                href="/ads"
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
              >
                کاوش در املاک
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
