"use client";

import CreateTemporaryRentScene from "@/scenes/profile/temporary-rent/create";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function AdminCreateTemporaryRentPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
            }
        >
            <CreateTemporaryRentScene adminMode={true} />
        </Suspense>
    );
}
