import NotificationsScene from "@/scenes/notifications";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "اعلان‌ها | ملک‌تودی",
    description: "مرکز اعلان‌ها و پیام‌های سیستمی حساب کاربری در ملک‌تودی",
};

export default function NotificationsPage() {
    return <NotificationsScene />;
}
