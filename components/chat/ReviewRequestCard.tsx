"use client";

import { cn } from "@/lib/utils";
import { reviewsService } from "@/services/reviews.service";
import { CheckCircle2, MessageSquare, Send, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReviewRequestCardProps {
    messageId: string;
    metadata?: {
        isReviewRequest?: boolean;
        targetType?: "agency" | "temporary-rent";
        targetId?: string;
        targetTitle?: string;
        rating?: number;
        comment?: string;
    } | null;
    isMine: boolean;
    conversationSubjectType?: string;
    conversationSubjectId?: string;
}

export function ReviewRequestCard({
    messageId,
    metadata,
    isMine,
    conversationSubjectType,
    conversationSubjectId,
}: ReviewRequestCardProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [savedRating, setSavedRating] = useState<number>(0);

    // Determine targetType and targetId
    const targetType: "agency" | "temporary-rent" =
        metadata?.targetType ||
        (conversationSubjectType === "RENTAL" ? "temporary-rent" : "agency");
    const targetId: string =
        metadata?.targetId || conversationSubjectId || "";
    const targetTitle: string =
        metadata?.targetTitle || (targetType === "temporary-rent" ? "میزبان اقامتگاه" : "مشاور املاک");

    // Load persisted submitted status from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`melktoday_review_${messageId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                setIsSubmitted(true);
                setSavedRating(parsed.rating || 5);
            }
        } catch {
            // ignore
        }
    }, [messageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("لطفاً ابتدا تعداد ستاره‌های امتیاز را انتخاب فرمایید.");
            return;
        }

        if (!targetId) {
            toast.error("شناسه ویترین کارشناس یافت نشد.");
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewsService.submit({
                targetType,
                targetId,
                rating,
                comment: comment.trim() || undefined,
            });

            toast.success("دیدگاه و امتیاز شما با موفقیت در ویترین کارشناس ثبت شد.");
            setIsSubmitted(true);
            setSavedRating(rating);
            try {
                localStorage.setItem(
                    `melktoday_review_${messageId}`,
                    JSON.stringify({ rating, comment: comment.trim() })
                );
            } catch {
                // ignore
            }
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || "خطا در ثبت نظر. لطفاً دوباره تلاش کنید.";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // If viewer is the agent/landlord who sent the request
    if (isMine) {
        return (
            <div className="w-full max-w-sm bg-gradient-to-br from-amber-50/50 via-white to-white rounded-3xl border border-amber-200/70 p-4 sm:p-5 shadow-xs space-y-3 text-right font-medium my-1">
                <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2 text-amber-800">
                        <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">درخواست ثبت نظر و فیدبک</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        ارسال‌شده
                    </span>
                </div>

                <div className="space-y-1.5">
                    <h4 className="text-brand font-black text-xs leading-snug">
                        درخواست ثبت نظر و امتیاز عملکرد برای مخاطب ارسال شد
                    </h4>
                    <p className="text-[11px] text-secondary leading-relaxed">
                        کاربر پس از پایان گفتگو می‌تواند امتیاز و دیدگاه خود را درباره عملکرد شما ثبت نماید تا در بخش نظرات ویترین نمایش داده شود.
                    </p>
                </div>
            </div>
        );
    }

    // If client has already submitted the review
    if (isSubmitted) {
        return (
            <div className="w-full max-w-sm bg-emerald-50/40 rounded-3xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs space-y-3 text-right font-medium my-1">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                    <div className="flex items-center gap-2 text-emerald-800">
                        <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">نظر شما ثبت شد</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ثبت نهایی
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-1 justify-center py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-5 h-5",
                                    star <= savedRating
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-gray-100 text-gray-300"
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-center text-xs font-bold text-emerald-900 leading-relaxed">
                        با تشکر از شما! نظر و امتیاز شما با موفقیت در ویترین کارشناس قرار گرفت.
                    </p>
                </div>
            </div>
        );
    }

    // Active review submission card for client
    return (
        <div className="w-full max-w-sm bg-white rounded-3xl border border-amber-200/90 p-4 sm:p-5 shadow-sm space-y-3.5 text-right font-medium my-1">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-soft-border pb-2.5">
                <div className="flex items-center gap-2 text-amber-800">
                    <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-xs font-black">ثبت نظر و امتیاز عملکرد</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    ویترین {targetTitle}
                </span>
            </div>

            {/* Description */}
            <p className="text-[11px] text-secondary leading-relaxed">
                لطفاً با ثبت نظر و امتیاز خود درباره این گفتگو، به بهبود خدمات کمک کنید. نظر شما در صفحه ویترین کارشناس منتشر خواهد شد.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                {/* 5-Star interactive selector */}
                <div className="flex flex-col items-center justify-center gap-1.5 py-1 bg-amber-50/40 rounded-2xl border border-amber-100/80 p-2.5">
                    <span className="text-[11px] font-bold text-amber-900">
                        امتیاز شما به عملکرد کارشناس:
                    </span>
                    <div className="flex items-center gap-1.5 dir-ltr" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= (hoverRating || rating);
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                                >
                                    <Star
                                        className={cn(
                                            "w-6 h-6 transition-colors",
                                            isFilled
                                                ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                                : "fill-gray-100 text-gray-300"
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Comment input */}
                <div className="space-y-1">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="نظر یا تجربه شما از این گفتگو (اختیاری)..."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-soft-border p-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none placeholder:text-secondary/50 text-brand"
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="w-full h-9 rounded-xl bg-brand text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-brand/90 transition-all disabled:opacity-40 disabled:hover:bg-brand cursor-pointer shadow-xs"
                >
                    {isSubmitting ? (
                        <span>در حال ثبت...</span>
                    ) : (
                        <>
                            <Send className="w-3.5 h-3.5 rotate-180" />
                            <span>ثبت نظر در ویترین</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
