import TemporaryRentPanelScene from "@/scenes/profile/temporary-rent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "پنل اجاره موقت | ملک تودی",
    description: "مدیریت آگهی‌های اجاره موقت شما",
};

export default function TemporaryRentPanelPage() {
    return <TemporaryRentPanelScene />;
}
