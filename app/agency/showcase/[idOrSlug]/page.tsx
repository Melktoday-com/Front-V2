import SingleAgencyScene from "@/scenes/single-agency";
import { Metadata } from "next";
import { AgencyFull } from "@/types/api/agency.types";

interface PageProps {
    params: Promise<{ idOrSlug: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://beta.melktoday.ir/backend/api";

async function fetchAgency(idOrSlug: string): Promise<AgencyFull | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/agencies/showcase/${encodeURIComponent(idOrSlug)}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) {
            const fallbackRes = await fetch(`${API_BASE_URL}/agencies/${encodeURIComponent(idOrSlug)}`, {
                next: { revalidate: 60 },
            });
            if (!fallbackRes.ok) return null;
            const fallbackJson = await fallbackRes.json();
            return fallbackJson.data || fallbackJson;
        }
        const json = await res.json();
        return json.data || json;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { idOrSlug } = await params;
    const agency = await fetchAgency(idOrSlug);

    if (!agency) {
        return {
            title: "ویترین آژانس املاک | ملک تودی",
            description: "ویترین اختصاصی آژانس املاک در سامانه ملک تودی",
        };
    }

    const title = `ویترین آژانس املاک ${agency.name} | ملک تودی`;
    const description = agency.bio
        ? agency.bio.slice(0, 160)
        : `مشاهده آگهی‌ها، مشاوران و ویترین آژانس املاک ${agency.name} در سامانه ملک تودی`;
    const canonical = `https://beta.melktoday.ir/agency/showcase/${agency.slug || agency.id}`;
    const images = agency.coverUrl
        ? [agency.coverUrl]
        : agency.logoUrl
        ? [agency.logoUrl]
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
                alt: agency.name,
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

export default async function AgencyShowcasePage({ params }: PageProps) {
    const { idOrSlug } = await params;
    const initialData = await fetchAgency(idOrSlug);
    return <SingleAgencyScene initialData={initialData ?? undefined} />;
}
