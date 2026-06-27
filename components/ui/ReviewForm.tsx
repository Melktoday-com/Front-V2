import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import React, { useState } from 'react';

interface ReviewFormProps {
    onSubmit: (rating: number, comment?: string) => Promise<void>;
    isLoading?: boolean;
}

export const ReviewForm = ({ onSubmit, isLoading }: ReviewFormProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        await onSubmit(rating, comment.trim() || undefined);
        setRating(0);
        setComment('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-soft-bg rounded-2xl p-5 border border-soft-border space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-brand block">امتیاز شما</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 focus:outline-none transition-transform active:scale-90"
                        >
                            <Star
                                size={28}
                                className={cn(
                                    "transition-colors",
                                    star <= (hoverRating || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 fill-transparent"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-brand block">توضیحات (اختیاری)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white border border-soft-border rounded-xl p-3 text-xs min-h-24 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="تجربه خود را بنویسید..."
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || rating === 0}
                className="w-full py-3 bg-brand text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
            >
                {isLoading ? "در حال ثبت..." : "ثبت دیدگاه"}
            </button>
        </form>
    );
};
