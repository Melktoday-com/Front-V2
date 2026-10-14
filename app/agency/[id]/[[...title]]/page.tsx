import SingleAgencyScene from "@/scenes/single-agency";
import { Metadata } from "next";
import { AgencyFull } from "@/types/api/agency.types";
import { serverFetch } from "@/lib/api/server";
import { getSiteBaseUrl } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string; title?: string[] }>;
}

async function fetchAgency(id: string): Promise<AgencyFull | null> {
    const showcase = await serverFetch<AgencyFull>(`/agencies/showcase/${encodeURIComponent(id)}`);
    if (showcase) return showcase;
    return await serverFetch<AgencyFull>(`/agencies/${encodeURIComponent(id)}`);
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

    const siteBase = getSiteBaseUrl();
    const title = `آژانس املاک ${agency.name} | ملک تودی`;
    const description = agency.bio
        ? agency.bio.slice(0, 160)
        : `مشاهده آگهی‌ها، مشاوران و ویترین آژانس املاک ${agency.name} در سامانه ملک تودی`;
    const canonical = `${siteBase}/agency/showcase/${agency.slug || agency.id}`;
    const images = agency.coverUrl
        ? [agency.coverUrl]
        : agency.logoUrl
        ? [agency.logoUrl]
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
