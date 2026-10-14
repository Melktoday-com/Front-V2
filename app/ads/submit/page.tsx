"use client";

import { Suspense } from "react";
import SubmitAdScene from "@/scenes/submit-ad";
import { Loader2 } from "lucide-react";

export default function SubmitAdPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-text-light font-bold text-sm">در حال بارگذاری فرم ثبت آگهی...</p>
                </div>
            }
        >
            <SubmitAdScene />
        </Suspense>
    );
}

