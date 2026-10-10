import { Metadata } from "next";
import { Suspense } from "react";
import SingleHostScene from "@/scenes/single-host";

interface HostPageProps {
  params: Promise<{ idOrSlug: string }>;
}

export async function generateMetadata({ params }: HostPageProps): Promise<Metadata> {
  const { idOrSlug } = await params;
  return {
    title: `اقامتگاه و ویترین میزبان | ملک تودی`,
    description: "مشاهده اقامتگاه‌ها، سوئیت‌ها و پست‌های میزبان در پلتفرم ملک‌تودی",
  };
}

export default async function HostShowcasePage({ params }: HostPageProps) {
  const { idOrSlug } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-soft-bg flex items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SingleHostScene idOrSlug={idOrSlug} />
    </Suspense>
  );
}
