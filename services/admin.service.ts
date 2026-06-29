import api from "@/lib/api/client";
import {
    AdjustWalletRequest,
    ApproveListingRequest,
    BanUserRequest,
    BroadcastNotificationRequest,
    CreateGeoZoneRequest,
    GeoZone,
    GiftCreditRequest,
    ModerationHistory,
    RejectListingRequest,
    SuspendUserRequest,
    UpdateGeoZoneRequest
} from "@/types/api/admin.types";

/**
 * Admin Service - Handles administrative operations
 * Corresponds to @modules/admin in backend
 */
export const adminService = {
    // User Moderation
    banUser: async (userId: string, data: BanUserRequest) => {
        const response = await api.post(`/admin/users/${userId}/ban`, data);
        return response.data;
    },

    unbanUser: async (userId: string, data: { note?: string }) => {
        const response = await api.post(`/admin/users/${userId}/unban`, data);
        return response.data;
    },

    suspendUser: async (userId: string, data: SuspendUserRequest) => {
        const response = await api.post(`/admin/users/${userId}/suspend`, data);
        return response.data;
    },

    reinstateUser: async (userId: string, data: { note?: string }) => {
        const response = await api.post(`/admin/users/${userId}/reinstate`, data);
        return response.data;
    },

    listUsers: async (params: { page?: number; limit?: number }) => {
        const response = await api.get("/admin/users", { params });
        return response.data;
    },

    getModerationHistory: async (userId: string): Promise<ModerationHistory[]> => {
        const response = await api.get(`/admin/users/${userId}/moderation-history`);
        return response.data;
    },

    // Wallet
    giftCredit: async (data: GiftCreditRequest) => {
        const response = await api.post("/admin/wallet/gift-credit", data);
        return response.data;
    },

    adjustWallet: async (data: AdjustWalletRequest) => {
        const response = await api.post("/admin/wallet/adjust", data);
        return response.data;
    },

    // Notifications
    broadcastNotification: async (data: BroadcastNotificationRequest) => {
        const response = await api.post("/admin/notifications/broadcast", data);
        return response.data;
    },

    // Listing Moderation
    approveListing: async (listingId: string, data: ApproveListingRequest) => {
        const response = await api.post(`/admin/listings/${listingId}/approve`, data);
        return response.data;
    },

    rejectListing: async (listingId: string, data: RejectListingRequest) => {
        const response = await api.post(`/admin/listings/${listingId}/reject`, data);
        return response.data;
    },

    // Geo Zones
    listGeoZones: async (zoneType: string): Promise<GeoZone[]> => {
        const response = await api.get(`/admin/geo/zones`, { params: { zoneType } });
        return response.data;
    },

    createGeoZone: async (data: CreateGeoZoneRequest) => {
        const response = await api.post("/admin/geo/zones", data);
        return response.data;
    },

    updateGeoZone: async (zoneId: string, data: UpdateGeoZoneRequest) => {
        const response = await api.put(`/admin/geo/zones/${zoneId}`, data);
        return response.data;
    },

    archiveGeoZone: async (zoneId: string) => {
        const response = await api.delete(`/admin/geo/zones/${zoneId}`);
        return response.data;
    },

    importGeoZonesKml: async (data: { content: string; type: string; parentZoneId?: string }) => {
        const response = await api.post("/geo/zones/import", data);
        return response.data;
    },

    // Reports
    listPendingReports: async () => {
        const response = await api.get("/admin/reports/pending");
        return response.data;
    },

    moderateReport: async (reportId: string, action: "RESOLVE" | "DISMISS", note?: string) => {
        const response = await api.patch(`/admin/reports/${reportId}/moderate`, { action, note });
        return response.data;
    },

    // Promotions
    listPendingPromotions: async (params: { page?: number; limit?: number } = {}) => {
        const response = await api.get("/admin/promotions/pending", { params });
        return response.data;
    },

    reviewPromotion: async (promotionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
        const response = await api.patch(`/admin/promotions/${promotionId}/review`, { action, reason });
        return response.data;
    },

    // Campaigns
    listPendingCampaigns: async (params: { page?: number; limit?: number } = {}) => {
        const response = await api.get("/admin/campaigns/pending", { params });
        return response.data;
    },

    reviewCampaign: async (campaignId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
        const response = await api.patch(`/admin/campaigns/${campaignId}/review`, { action, reason });
        return response.data;
    },

    // Config
    updatePlanLimits: async (data: { plan: string; limits: any }) => {
        const response = await api.put("/admin/config/plan-limits", data);
        return response.data;
    },

    // Categories Management
    createCategory: async (data: { key: string; displayName: string }) => {
        const response = await api.post("/ads/categories", data);
        return response.data;
    },

    updateCategory: async (categoryId: string, data: { displayName: string }) => {
        const response = await api.patch(`/ads/categories/${categoryId}`, data);
        return response.data;
    },

    archiveCategory: async (categoryId: string) => {
        const response = await api.delete(`/ads/categories/${categoryId}`);
        return response.data;
    },

    addSubcategory: async (categoryId: string, data: { subcategoryKey: string; displayName: string }) => {
        const response = await api.post(`/ads/categories/${categoryId}/subcategories`, data);
        return response.data;
    },

    archiveSubcategory: async (categoryId: string, subcategoryKey: string) => {
        const response = await api.delete(`/ads/categories/${categoryId}/subcategories/${subcategoryKey}`);
        return response.data;
    },
};
