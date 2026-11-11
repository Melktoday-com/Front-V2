"use client";

import { Footer } from "@/components/layout/Footer";
import { cn, toPersianDigits } from "@/lib/utils";
import { FAQ_DATA, FaqCategory } from "./faqData";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Compass,
  CreditCard,
  Headphones,
  HelpCircle,
  Layers,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// Icon mapping dictionary
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  UserCheck,
  Search,
  PlusCircle,
  Building2,
  Compass,
  Layers,
  CreditCard,
  Headphones,
  ShieldCheck,
};

export default function FaqScene() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Toggle accordion item
  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Normalize Persian search query for flexible matching
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[\u200c\u200d\u200e\u200f]/g, " ")
      .replace(/[ي]/g, "ی")
      .replace(/[ك]/g, "ک")
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .trim();
  };

  // Filtered categories and questions
  const filteredData = useMemo(() => {
    const q = normalize(searchQuery);

    return FAQ_DATA.map((cat) => {
      // If a specific category is chosen and not 'all', check match
      const isCatSelected = selectedCategory === "all" || selectedCategory === cat.id;

      if (!isCatSelected) {
        return { ...cat, items: [] };
      }

      if (!q) {
        return cat;
      }

      // Filter items within matching category by search query
      const matchingItems = cat.items.filter((item) => {
        return normalize(item.q).includes(q) || normalize(item.a).includes(q);
      });

      return {
        ...cat,
        items: matchingItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [selectedCategory, searchQuery]);

  const totalQuestionsCount = useMemo(() => {
    return FAQ_DATA.reduce((acc, cat) => acc + cat.items.length, 0);
  }, []);

  const totalFilteredCount = useMemo(() => {
    return filteredData.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredData]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full pt-6 pb-16 space-y-8 md:space-y-10">
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
          <span className="text-foreground font-medium">سوالات متداول</span>
        </nav>

        {/* Header - Minimalist & Focused */}
        <section className="bg-surface rounded-2xl border border-border/70 p-6 sm:p-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs text-foreground-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>مرکز راهنما و پاسخ به پرسش‌ها</span>
          </div>

          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              سوالات متداول کاربران ملک تودی
            </h1>
            <p className="text-foreground-muted text-xs sm:text-sm leading-relaxed">
              پاسخ به پرتکرارترین پرسش‌ها درباره ثبت‌نام، ثبت آگهی، جستجوی املاک، پنل مشاوران، پرداخت‌ها و امنیت پلتفرم.
            </p>
          </div>

          {/* Search Bar */}
          <div className="pt-2 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-foreground-muted absolute right-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جست‌وجوی سوال یا موضوع (مثال: ثبت آگهی، هزینه، ویرایش، حذف حساب...)"
                className="w-full bg-surface-secondary border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pr-10 pl-10 py-3 text-xs sm:text-sm text-foreground placeholder:text-foreground-muted/60 transition-colors outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 p-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-border/40 transition-colors"
                  title="پاک کردن جستجو"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-[11px] text-foreground-muted mt-2 pr-1">
                {toPersianDigits(totalFilteredCount)} مورد برای جست‌وجوی شما یافت شد.
              </p>
            )}
          </div>
        </section>



        {/* FAQ Accordion List */}
        <section className="space-y-6">
          {filteredData.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border/70 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-foreground-muted flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                نتیجه‌ای برای جست‌وجوی شما یافت نشد
              </h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
                لطفاً کلمات کلیدی دیگری را جست‌وجو کنید یا دسته‌بندی موضوعات را تغییر دهید.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                نمایش همه سوالات
              </button>
            </div>
          ) : (
            filteredData.map((category) => {
              const IconComp = ICON_MAP[category.icon] || HelpCircle;

              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-bold text-sm sm:text-base pr-1">
                    <IconComp className="w-4 h-4 text-primary shrink-0" />
                    <h2>{category.title}</h2>
                    <span className="text-xs text-foreground-muted font-normal">
                      ({toPersianDigits(category.items.length)} سوال)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {category.items.map((item, idx) => {
                      const itemKey = `${category.id}-${idx}`;
                      const isOpen = !!openItems[itemKey];

                      return (
                        <div
                          key={idx}
                          className="bg-surface rounded-2xl border border-border/70 hover:border-border transition-colors overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(itemKey)}
                            aria-expanded={isOpen}
                            className="w-full p-4 sm:p-5 text-right flex items-start justify-between gap-3 cursor-pointer group"
                          >
                            <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-relaxed">
                              {item.q}
                            </span>
                            <div
                              className={cn(
                                "w-6 h-6 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0 mt-0.5 text-foreground-muted transition-transform duration-200",
                                isOpen && "rotate-180 text-primary bg-primary/10"
                              )}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-foreground-muted leading-loose border-t border-border/50 text-justify whitespace-pre-line">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Support & Assistance Card */}
        <section className="bg-surface-secondary rounded-2xl border border-border/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-right">
          <div className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
              <Headphones className="w-4 h-4 text-primary" />
              <span>پاسخ سوال خود را نیافتید؟</span>
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              تیم پشتیبانی ملک تودی همه روزه در ساعات کاری آماده پاسخگویی و راهنمایی شماست.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <a
              href="tel:02191003417"
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>تماس با پشتیبانی</span>
            </a>

          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
