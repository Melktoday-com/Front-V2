import SubscriptionsScene from "@/scenes/subscriptions";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "پلن‌های اشتراک و سهمیه‌ها | ملک‌تودی",
    description: "خرید پلن‌های اشتراک، سهمیه‌های انتشار، نردبان و برچسب‌های فوری در ملک‌تودی",
};

export default function SubscriptionsPage() {
    return <SubscriptionsScene />;
}
