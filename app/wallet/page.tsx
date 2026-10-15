import WalletScene from "@/scenes/wallet";
import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "کیف پول | ملک‌تودی",
    description: "مدیریت موجودی و تراکنش‌های کیف پول در ملک‌تودی",
};

export default function WalletPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[50vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <WalletScene />
        </Suspense>
    );
}
