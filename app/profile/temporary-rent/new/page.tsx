import CreateTemporaryRentScene from "@/scenes/profile/temporary-rent/create";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "ثبت اقامتگاه جدید | ملک تودی",
    description: "ثبت آگهی جدید اجاره موقت در ملک تودی",
};

export default function CreateTemporaryRentPage() {
    return <CreateTemporaryRentScene />;
}
