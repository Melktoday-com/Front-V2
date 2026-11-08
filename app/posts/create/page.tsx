import { Metadata } from "next";
import CreatePostScene from "@/scenes/create-post";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ایجاد و انتشار پست | ملک‌تودی",
  description: "استودیو تخصصی انتشار پست‌های تصویری و مقالات تحلیلی برای میزبانان، مشاوران املاک و پلتفرم",
};

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" dir="rtl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-foreground-secondary">در حال بارگذاری استودیو محتوا...</p>
        </div>
      }
    >
      <CreatePostScene />
    </Suspense>
  );
}
