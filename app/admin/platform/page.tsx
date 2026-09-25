import { Metadata } from "next";
import AdminPlatformScene from "@/scenes/admin-platform";

export const metadata: Metadata = {
  title: "مدیریت صفحه رسمی پلتفرم | پنل مدیریت ملک تودی",
};

export default function AdminPlatformPage() {
  return <AdminPlatformScene />;
}
