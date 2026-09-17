export default function Loading() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
            <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-primary animate-ping opacity-75" />
                </div>
            </div>
            <p className="text-sm font-bold text-secondary animate-pulse">
                در حال بارگذاری اطلاعات...
            </p>
        </div>
    );
}
