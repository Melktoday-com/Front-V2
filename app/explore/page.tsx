import ExploreScene from "@/scenes/explore";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "کاوش و محتوای ملکی | ملک تودی",
    description: "فید مقالات، تحلیل بازار، راهنماها و محتوای تخصصی تولید شده توسط مشاورین و آژانس‌های املاک",
};

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">در حال بارگذاری کاوش...</div>}>
            <ExploreScene />
        </Suspense>
    );
}
