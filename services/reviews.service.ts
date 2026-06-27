import apiClient from "@/lib/api/client";

export interface Review {
    id: string;
    authorId: string;
    rating: number;
    comment?: string;
    createdAt: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
}

export const reviewsService = {
    async submit(data: {
        targetId: string;
        targetType: 'agency' | 'temporary-rent';
        rating: number;
        comment?: string;
    }) {
        const response = await apiClient.post('/reviews', data);
        return response.data;
    },

    async list(targetType: 'agency' | 'temporary-rent', targetId: string): Promise<Review[]> {
        const response = await apiClient.get(`/reviews/${targetType}/${targetId}`);
        return response.data as Review[];
    },

    async getStats(targetType: 'agency' | 'temporary-rent', targetId: string): Promise<ReviewStats> {
        const response = await apiClient.get(`/reviews/${targetType}/${targetId}/stats`);
        return response.data as ReviewStats;
    },
};
