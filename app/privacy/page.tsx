import RulesScene from "@/scenes/rules";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "سیاست‌نامه حریم خصوصی | ملک تودی",
  description:
    "سند سیاست‌نامه حفاظت از حریم خصوصی و امنیت داده‌های کاربران در پلتفرم بهین کاشانه امروز (ملک تودی).",
};

export default function PrivacyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-secondary font-bold">
          در حال بارگذاری سیاست‌نامه حریم خصوصی...
        </div>
      }
    >
      <RulesScene />
    </Suspense>
  );
}
