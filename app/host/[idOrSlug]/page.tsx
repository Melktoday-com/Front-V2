import { Metadata } from "next";
import { Suspense } from "react";
import SingleHostScene from "@/scenes/single-host";
import { HostAbout, ShowcaseResponse } from "@/types/api/showcase.types";

interface HostPageProps {
  params: Promise<{ idOrSlug: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://beta.melktoday.ir/backend/api";

async function fetchHostShowcase(idOrSlug: string): Promise<ShowcaseResponse<HostAbout> | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/showcase/HOST/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: HostPageProps): Promise<Metadata> {
  const { idOrSlug } = await params;
  const showcase = await fetchHostShowcase(idOrSlug);

  if (!showcase || !showcase.header) {
    return {
      title: "ویترین میزبان | ملک تودی",
      description: "مشاهده اقامتگاه‌ها و ویترین میزبان در پلتفرم ملک‌تودی",
    };
  }

  const header = showcase.header;
  const bio = showcase.about?.bio;
  const title = `ویترین میزبان ${header.title} | ملک تودی`;
  const description = bio
    ? bio.slice(0, 160)
    : `مشاهده اقامتگاه‌ها، سوئیت‌ها و پست‌های ${header.title} در سامانه ملک تودی`;
  const canonical = `https://beta.melktoday.ir/host/${header.slug || idOrSlug}`;
  const images = header.coverUrl
    ? [header.coverUrl]
    : header.avatarUrl
    ? [header.avatarUrl]
    : ["https://beta.melktoday.ir/og-image.png"];

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ملک تودی",
      locale: "fa_IR",
      type: "profile",
      images: images.map((url) => ({
        url,
        alt: header.title,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function HostShowcasePage({ params }: HostPageProps) {
  const { idOrSlug } = await params;
  const initialData = await fetchHostShowcase(idOrSlug);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-soft-bg flex items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SingleHostScene idOrSlug={idOrSlug} initialData={initialData ?? undefined} />
    </Suspense>
  );
}
