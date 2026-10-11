import SingleAdScene from "@/scenes/single-add";
import { Metadata } from "next";
import { AdDetail } from "@/types/api/ads.types";
import { getMediaPosterUrl } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string; title?: string[] }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://beta.melktoday.ir/backend/api";

async function fetchAd(id: string): Promise<AdDetail | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/ads/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const ad = await fetchAd(id);

    if (!ad) {
        return {
            title: "آگهی پیدا نشد | ملک تودی",
            description: "آگهی مورد نظر در سامانه ملک تودی یافت نشد.",
        };
    }

    const title = `${ad.title} | ملک تودی`;
    const description = ad.description
        ? ad.description.slice(0, 160)
        : `${ad.title} - ${ad.cityName || 'ایران'} در ملک تودی`;
    const canonical = `https://beta.melktoday.ir/ads/${ad.adId}`;
    const images =
        ad.mediaIds && ad.mediaIds.length > 0
            ? [getMediaPosterUrl(ad.mediaIds[0])]
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
    const initialData = await fetchAd(id);
    return <SingleAdScene initialData={initialData ?? undefined} />;
}
