import RulesScene from "@/scenes/rules";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "شرایط و مقررات استفاده | ملک تودی",
  description:
    "سند شرایط و مقررات استفاده از پلتفرم ملک تودی؛ قرارداد حقوقی میان کاربران و پلتفرم بهین کاشانه امروز، سیاست‌های انتشار آگهی، حقوق و تکالیف طرفین.",
};

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-secondary font-bold">
          در حال بارگذاری قوانین و مقررات...
        </div>
      }
    >
      <RulesScene />
    </Suspense>
  );
}
