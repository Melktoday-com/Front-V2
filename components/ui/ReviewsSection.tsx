import { Review, reviewsService, ReviewStats } from '@/services/reviews.service';
import { MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ReviewForm } from './ReviewForm';
import { ReviewItem } from './ReviewItem';
import { ReviewStars } from './ReviewStars';

interface ReviewsSectionProps {
    targetId: string;
    targetType: 'agency' | 'temporary-rent';
}

export const ReviewsSection = ({ targetId, targetType }: ReviewsSectionProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reviewsData, statsData] = await Promise.all([
                reviewsService.list(targetType, targetId),
                reviewsService.getStats(targetType, targetId)
            ]);
            setReviews(reviewsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [targetId, targetType]);

    const handleReviewSubmit = async (rating: number, comment?: string) => {
        setIsSubmitting(true);
        try {
            await reviewsService.submit({
                targetId,
                targetType,
                rating,
                comment
            });
            toast.success('دیدگاه شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود.');
            // Re-fetch reviews to show the user (depending on if backend returns published or pending)
            // Typically pending reviews won't show up immediately in the public list
            fetchData();
        } catch (error) {
            toast.error('خطا در ثبت دیدگاه. لطفا دوباره تلاش کنید.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-brand" />
                    <h2 className="text-sm font-black text-brand">دیدگاه‌ها</h2>
                </div>
                {stats && stats.totalReviews > 0 && (
                    <ReviewStars rating={stats.averageRating} showText count={stats.totalReviews} />
                )}
            </div>

            <ReviewForm onSubmit={handleReviewSubmit} isLoading={isSubmitting} />

            <div className="space-y-2">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-20 bg-soft-bg animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="divide-y divide-soft-border">
                        {reviews.map((review) => (
                            <ReviewItem
                                key={review.id}
                                authorName="کاربر مِلک تودِی"
                                rating={review.rating}
                                comment={review.comment}
                                date={review.createdAt}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center border-2 border-dashed border-soft-border rounded-2xl">
                        <p className="text-xs text-text-light">هنوز هیچ دیدگاهی ثبت نشده است. اولین نفر باشید!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
