import { Metadata } from "next";
import CreatePostScene from "@/scenes/create-post";

export const metadata: Metadata = {
  title: "ایجاد و انتشار پست | ملک‌تودی",
  description: "استودیو تخصصی انتشار پست‌های تصویری و مقالات تحلیلی برای میزبانان، مشاوران املاک و پلتفرم",
};

export default function CreatePostPage() {
  return <CreatePostScene />;
}
