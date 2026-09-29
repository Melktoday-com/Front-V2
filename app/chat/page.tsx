"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ChatRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const query = searchParams.toString();
        const target = query ? `/profile/chat?${query}` : "/profile/chat";
        router.replace(target);
    }, [router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-slate-400 text-sm animate-pulse">در حال انتقال به گفت‌وگوها...</p>
        </div>
    );
}

export default function ChatRedirectPage() {
    return (
        <Suspense fallback={null}>
            <ChatRedirectContent />
        </Suspense>
    );
}
