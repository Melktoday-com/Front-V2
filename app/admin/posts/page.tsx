import { Metadata } from "next";
import AdminPostsScene from "@/scenes/admin-posts";

export const metadata: Metadata = {
  title: "مدیریت پست‌ها و مقالات | پنل مدیریت ملک تودی",
  description: "مدیریت و نظارت جامع بر مقالات و پست‌های وبلاگ همه ناشران پلتفرم ملک‌تودی",
};

export default function AdminPostsPage() {
  return <AdminPostsScene />;
}
