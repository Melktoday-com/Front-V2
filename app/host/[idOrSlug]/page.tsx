import { Metadata } from "next";
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
  return <SingleHostScene idOrSlug={idOrSlug} />;
}
