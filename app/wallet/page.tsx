import WalletScene from "@/scenes/wallet";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "کیف پول | ملک‌تودی",
    description: "مدیریت موجودی و تراکنش‌های کیف پول در ملک‌تودی",
};

export default function WalletPage() {
    return <WalletScene />;
}
