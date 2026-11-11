import FaqScene from "@/scenes/faq";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "سوالات متداول (FAQ) | ملک تودی",
  description:
    "پاسخ به سوالات متداول درباره ثبت آگهی، جست‌وجوی ملک، پنل مشاوران و دفاتر املاک، پرداخت و امنیت در ملک تودی.",
};

export default function FaqPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-foreground-muted font-bold">
          در حال بارگذاری سوالات متداول...
        </div>
      }
    >
      <FaqScene />
    </Suspense>
  );
}
