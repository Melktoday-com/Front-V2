import ResidenceDetailScene from "@/scenes/single-temporary-rent";
import { Metadata } from "next";
import { TemporaryRentAd } from "@/types/api/temporary-rent.types";
import { getMediaPosterUrl } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string; title?: string[] }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://beta.melktoday.ir/backend/api";

async function fetchTemporaryRentAd(id: string): Promise<TemporaryRentAd | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/temporary-rent/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || json;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const residence = await fetchTemporaryRentAd(id);

    if (!residence) {
        return {
            title: "اقامتگاه پیدا نشد | ملک تودی",
            description: "اقامتگاه مورد نظر در سامانه ملک تودی یافت نشد.",
        };
    }

    const title = `${residence.title} | اجاره اقامتگاه در ملک تودی`;
    const description = residence.description
        ? residence.description.slice(0, 160)
        : `${residence.title} - ${residence.cityName || 'ایران'} در سامانه اجاره کوتاه‌مدت ملک تودی`;
    const canonical = `https://beta.melktoday.ir/temporary-rent/${residence.id}`;
    const images =
        residence.mediaIds && residence.mediaIds.length > 0
            ? [getMediaPosterUrl(residence.mediaIds[0])]
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
                alt: residence.title,
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
    const initialData = await fetchTemporaryRentAd(id);
    return <ResidenceDetailScene initialData={initialData ?? undefined} />;
}
