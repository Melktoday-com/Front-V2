import { Metadata } from "next";
import SinglePostScene from "@/scenes/single-post";
import { Suspense } from "react";

interface PostPageProps {
  params: Promise<{ idOrSlug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { idOrSlug } = await params;
  return {
    title: `مشاهده محتوا و پست ملکی | ملک تودی`,
    description: "مشاهده جزئیات، تصاویر، مقالات و تحلیل‌های تخصصی املاک و اقامتگاه‌ها در ملک‌تودی",
  };
}

export default async function SinglePostPage({ params }: PostPageProps) {
  const { idOrSlug } = await params;
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-bold text-sm">در حال بارگذاری محتوای پست...</div>}>
      <SinglePostScene idOrSlug={idOrSlug} />
    </Suspense>
  );
}
