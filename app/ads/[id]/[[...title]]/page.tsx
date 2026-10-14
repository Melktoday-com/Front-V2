import SingleAdScene from "@/scenes/single-add";
import { Metadata } from "next";
import { AdDetail } from "@/types/api/ads.types";
import { getMediaPosterUrl, getSiteBaseUrl } from "@/lib/utils";
import { serverFetch } from "@/lib/api/server";

interface PageProps {
    params: Promise<{ id: string; title?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const ad = await serverFetch<AdDetail>(`/ads/${encodeURIComponent(id)}`);

    if (!ad) {
        return {
            title: "مشاهده آگهی | ملک تودی",
            description: "مشاهده جزئیات ملک و اطلاعات تماس در ملک تودی.",
        };
    }

    const siteBase = getSiteBaseUrl();
    const title = `${ad.title} | ملک تودی`;
    const description = ad.description
        ? ad.description.slice(0, 160)
        : `${ad.title} - ${ad.cityName || 'ایران'} در ملک تودی`;
    const canonical = `${siteBase}/ads/${ad.adId}`;
    const images =
        ad.mediaIds && ad.mediaIds.length > 0
            ? [getMediaPosterUrl(ad.mediaIds[0])]
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
            type: "article",
            images: images.map((url) => ({
                url,
                alt: ad.title,
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

export default async function PropertyDetailPage({ params }: PageProps) {
    const { id } = await params;
    const initialData = await serverFetch<AdDetail>(`/ads/${encodeURIComponent(id)}`);
    return <SingleAdScene adId={id} initialData={initialData ?? undefined} />;
}
