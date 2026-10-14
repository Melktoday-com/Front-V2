import { Metadata } from "next";
import { Suspense } from "react";
import SingleHostScene from "@/scenes/single-host";
import { HostAbout, ShowcaseResponse } from "@/types/api/showcase.types";
import { serverFetch } from "@/lib/api/server";
import { getSiteBaseUrl } from "@/lib/utils";

interface HostPageProps {
  params: Promise<{ idOrSlug: string }>;
}

export async function generateMetadata({ params }: HostPageProps): Promise<Metadata> {
  const { idOrSlug } = await params;
  const showcase = await serverFetch<ShowcaseResponse<HostAbout>>(`/showcase/HOST/${encodeURIComponent(idOrSlug)}`);

  if (!showcase || !showcase.header) {
    return {
      title: "ویترین میزبان | ملک تودی",
      description: "مشاهده اقامتگاه‌ها و ویترین میزبان در پلتفرم ملک‌تودی",
    };
  }

  const siteBase = getSiteBaseUrl();
  const header = showcase.header;
  const bio = showcase.about?.bio;
  const title = `ویترین میزبان ${header.title} | ملک تودی`;
  const description = bio
    ? bio.slice(0, 160)
    : `مشاهده اقامتگاه‌ها، سوئیت‌ها و پست‌های ${header.title} در سامانه ملک تودی`;
  const canonical = `${siteBase}/host/${header.slug || idOrSlug}`;
  const images = header.coverUrl
    ? [header.coverUrl]
    : header.avatarUrl
    ? [header.avatarUrl]
    : [`${siteBase}/og-image.png`];

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
  const initialData = await serverFetch<ShowcaseResponse<HostAbout>>(`/showcase/HOST/${encodeURIComponent(idOrSlug)}`);

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
