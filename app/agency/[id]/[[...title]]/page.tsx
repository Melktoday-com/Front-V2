import SingleAgencyScene from "@/scenes/single-agency";
import { Metadata } from "next";
import { AgencyFull } from "@/types/api/agency.types";

interface PageProps {
    params: Promise<{ id: string; title?: string[] }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://beta.melktoday.ir/backend/api";

async function fetchAgency(id: string): Promise<AgencyFull | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/agencies/showcase/${encodeURIComponent(id)}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) {
            // Fallback to /agencies/:id
            const fallbackRes = await fetch(`${API_BASE_URL}/agencies/${encodeURIComponent(id)}`, {
                next: { revalidate: 60 },
            });
            if (!fallbackRes.ok) return null;
            return await fallbackRes.json();
        }
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const agency = await fetchAgency(id);

    if (!agency) {
        return {
            title: "آژانس املاک پیدا نشد | ملک تودی",
            description: "آژانس املاک مورد نظر در سامانه ملک تودی یافت نشد.",
        };
    }

    const title = `آژانس املاک ${agency.name} | ملک تودی`;
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

export default async function AgencyDetailPage({ params }: PageProps) {
    const { id } = await params;
    const initialData = await fetchAgency(id);
    return <SingleAgencyScene initialData={initialData ?? undefined} />;
}
