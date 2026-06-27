import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface ReviewStarsProps {
    rating: number;
    size?: number;
    className?: string;
    showText?: boolean;
    count?: number;
}

export const ReviewStars = ({ rating, size = 12, className, showText = false, count }: ReviewStarsProps) => {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        className={cn(
                            star <= Math.round(rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 fill-gray-100"
                        )}
                    />
                ))}
            </div>
            {showText && (
                <span className="text-[10px] font-medium text-gray-500 mt-0.5">
                    {rating > 0 ? rating.toFixed(1) : "بدون امتیاز"}
                    {count !== undefined && count > 0 && ` (${count})`}
                </span>
            )}
        </div>
    );
};
