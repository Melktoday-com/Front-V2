export function NotificationSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-soft-border/50 bg-white animate-pulse"
                >
                    <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-soft-bg shrink-0" />
                        <div className="space-y-2.5 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-20 bg-soft-bg rounded-full" />
                                <div className="h-3 w-16 bg-soft-bg rounded-full" />
                            </div>
                            <div className="h-4 w-48 bg-soft-bg rounded-lg" />
                            <div className="h-3 w-full max-w-md bg-soft-bg rounded-lg" />
                        </div>
                    </div>
                    <div className="h-9 w-24 bg-soft-bg rounded-xl shrink-0" />
                </div>
            ))}
        </div>
    );
}
