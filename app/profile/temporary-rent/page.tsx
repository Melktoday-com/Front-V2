import TemporaryRentPanelScene from "@/scenes/profile/temporary-rent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "پنل اجاره روزانه | ملک تودی",
    description: "مدیریت آگهی‌های اجاره روزانه شما",
};

export default function TemporaryRentPanelPage() {
    return <TemporaryRentPanelScene />;
}
