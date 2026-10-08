import AboutScene from "@/scenes/about";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "درباره ما | ملکتودی",
  description:
    "آشنایی با ملکتودی؛ بستری یکپارچه برای معرفی و جست‌وجوی انواع املاک، جهت تسهیل مسیر تصمیم‌گیری خریداران، مستأجران، مالکان و فعالان حوزه املاک.",
};

export default function AboutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-secondary font-bold">
          در حال بارگذاری صفحه درباره ما...
        </div>
      }
    >
      <AboutScene />
    </Suspense>
  );
}
