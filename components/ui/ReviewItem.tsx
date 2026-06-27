import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { ReviewStars } from './ReviewStars';

interface ReviewItemProps {
    authorName: string;
    rating: number;
    comment?: string;
    date: string | Date;
}

export const ReviewItem = ({ authorName, rating, comment, date }: ReviewItemProps) => {
    return (
        <div className="py-4 border-b border-soft-border last:border-0">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-xs font-bold text-brand block">{authorName || 'کاربر مهمان'}</span>
                    <span className="text-[10px] text-text-light">
                        {formatDistanceToNow(new Date(date), { addSuffix: true, locale: faIR })}
                    </span>
                </div>
                <ReviewStars rating={rating} />
            </div>
            {comment && (
                <p className="text-xs text-brand leading-relaxed">
                    {comment}
                </p>
            )}
        </div>
    );
};
