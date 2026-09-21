"use client";

import SubmitAdScene from "@/scenes/submit-ad";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function AdminCreateAdPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            }
        >
            <SubmitAdScene adminMode={true} />
        </Suspense>
    );
}
