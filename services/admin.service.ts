import api from "@/lib/api/client";
import {
    AdjustWalletRequest,
    ApproveListingRequest,
    BanUserRequest,
    BroadcastNotificationRequest,
    AdminCreateAdRequest,
    AdminCreateTemporaryRentRequest,
    CreateAdminAttributeRequest,
    CreateAdminCategoryRequest,
    CreateAdminPriceModelRequest,
    CreateAdminSubcategoryRequest,
    CreateGeoZoneRequest,
    GeoZone,
    GiftCreditRequest,
    ModerationHistory,
    RejectListingRequest,
    SuspendUserRequest,
    UpdateAdminAttributeRequest,
    UpdateAdminCategoryRequest,
    UpdateAdminPriceModelRequest,
    UpdateAdminSubcategoryRequest,
    UpdateGeoZoneRequest,
    UpdatePlanLimitsRequest,
    UserLookupResponse,
    ListArchivedCategoriesResponse,
    ReviewAgentApplicationRequest,
    AdminAgenciesListResponse,
    ListUsersResponse,
    AdminReport,
    ListPendingPromotionsResponse,
    ListPendingCampaignsResponse,
    HostApplicationResponse,
    ReviewHostApplicationRequest,
} from "@/types/api/admin.types";
import { AttributeDefinition, CategoryListItem, PriceModel, Subcategory } from "@/types/api/ads.types";
import {
    TemporaryRentAttributeDefinition,
    TemporaryRentCategory,
    TemporaryRentPriceModel,
    TemporaryRentSubcategory
} from "@/types/api/temporary-rent.types";

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

    listUsers: async (params: { page?: number; limit?: number }): Promise<ListUsersResponse> => {
        const response = await api.get<ListUsersResponse>("/admin/users", { params });
        return response.data;
    },

    lookupUserByPhone: async (phoneNumber: string): Promise<UserLookupResponse> => {
        const response = await api.get<UserLookupResponse>("/admin/users/lookup", {
            params: { phoneNumber },
        });
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
    listPendingReports: async (): Promise<AdminReport[]> => {
        const response = await api.get<AdminReport[]>("/admin/reports/pending");
        return response.data;
    },

    moderateReport: async (reportId: string, action: "RESOLVE" | "DISMISS", note?: string) => {
        const response = await api.patch(`/admin/reports/${reportId}/moderate`, { action, note });
        return response.data;
    },

    // Promotions
    listPendingPromotions: async (params: { page?: number; limit?: number } = {}): Promise<ListPendingPromotionsResponse> => {
        const response = await api.get<ListPendingPromotionsResponse>("/admin/promotions/pending", { params });
        return response.data;
    },

    reviewPromotion: async (promotionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
        const response = await api.patch(`/admin/promotions/${promotionId}/review`, { action, reason });
        return response.data;
    },

    // Campaigns
    listPendingCampaigns: async (params: { page?: number; limit?: number } = {}): Promise<ListPendingCampaignsResponse> => {
        const response = await api.get<ListPendingCampaignsResponse>("/admin/campaigns/pending", { params });
        return response.data;
    },

    reviewCampaign: async (campaignId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
        const response = await api.patch(`/admin/campaigns/${campaignId}/review`, { action, reason });
        return response.data;
    },

    // Config
    updatePlanLimits: async (data: UpdatePlanLimitsRequest) => {
        const response = await api.put("/admin/config/plan-limits", data);
        return response.data;
    },

    // Categories & Subcategories Management
    createCategory: async (data: CreateAdminCategoryRequest): Promise<CategoryListItem> => {
        const response = await api.post("/ads/categories", data);
        return response.data;
    },

    updateCategory: async (categoryId: string, data: UpdateAdminCategoryRequest): Promise<CategoryListItem> => {
        const response = await api.patch(`/ads/categories/${categoryId}`, data);
        return response.data;
    },

    archiveCategory: async (categoryId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/ads/categories/${categoryId}`);
        return response.data;
    },

    addSubcategory: async (categoryId: string, data: CreateAdminSubcategoryRequest): Promise<Subcategory> => {
        const response = await api.post(`/ads/categories/${categoryId}/subcategories`, data);
        return response.data;
    },

    updateSubcategory: async (subcategoryId: string, data: UpdateAdminSubcategoryRequest): Promise<Subcategory> => {
        const response = await api.patch(`/ads/subcategories/${subcategoryId}`, data);
        return response.data;
    },

    archiveSubcategory: async (subcategoryId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/ads/subcategories/${subcategoryId}`);
        return response.data;
    },

    // Price Models Management
    listPriceModels: async (params?: { onlyActive?: boolean }): Promise<PriceModel[]> => {
        const response = await api.get("/ads/admin/price-models", { params });
        return response.data;
    },

    createPriceModel: async (data: CreateAdminPriceModelRequest): Promise<PriceModel> => {
        const response = await api.post("/ads/admin/price-models", data);
        return response.data;
    },

    updatePriceModel: async (priceModelId: string, data: UpdateAdminPriceModelRequest): Promise<PriceModel> => {
        const response = await api.patch(`/ads/admin/price-models/${priceModelId}`, data);
        return response.data;
    },

    getSubcategoryPriceModels: async (subcategoryId: string): Promise<PriceModel[]> => {
        const response = await api.get(`/ads/subcategories/${subcategoryId}/price-models`);
        return response.data;
    },

    assignPriceModelsToSubcategory: async (subcategoryId: string, priceModelIds: string[]): Promise<PriceModel[]> => {
        const response = await api.put(`/ads/subcategories/${subcategoryId}/price-models`, { priceModelIds });
        return response.data;
    },

    // Dynamic Attributes Management
    getSubcategoryAttributes: async (subcategoryId: string): Promise<AttributeDefinition[]> => {
        const response = await api.get(`/ads/subcategories/${subcategoryId}/attributes`);
        return response.data;
    },

    createSubcategoryAttribute: async (subcategoryId: string, data: CreateAdminAttributeRequest): Promise<AttributeDefinition> => {
        const response = await api.post(`/ads/subcategories/${subcategoryId}/attributes`, data);
        return response.data;
    },

    updateSubcategoryAttribute: async (subcategoryId: string, attributeId: string, data: UpdateAdminAttributeRequest): Promise<AttributeDefinition> => {
        const response = await api.patch(`/ads/subcategories/${subcategoryId}/attributes/${attributeId}`, data);
        return response.data;
    },

    deleteSubcategoryAttribute: async (subcategoryId: string, attributeId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/ads/subcategories/${subcategoryId}/attributes/${attributeId}`);
        return response.data;
    },

    // ─────────────────────────────────────────────────────────────────
    // Temporary Rental Admin Operations
    // ─────────────────────────────────────────────────────────────────
    listTemporaryRentCategories: async (params?: { includeArchived?: boolean }): Promise<TemporaryRentCategory[]> => {
        const response = await api.get("/temporary-rent/categories", { params });
        return response.data.categories || response.data;
    },

    createTemporaryRentCategory: async (data: CreateAdminCategoryRequest): Promise<TemporaryRentCategory> => {
        const response = await api.post("/temporary-rent/admin/categories", data);
        return response.data;
    },

    updateTemporaryRentCategory: async (categoryId: string, data: UpdateAdminCategoryRequest): Promise<TemporaryRentCategory> => {
        const response = await api.patch(`/temporary-rent/admin/categories/${categoryId}`, data);
        return response.data;
    },

    archiveTemporaryRentCategory: async (categoryId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/temporary-rent/admin/categories/${categoryId}`);
        return response.data;
    },

    addTemporaryRentSubcategory: async (categoryId: string, data: CreateAdminSubcategoryRequest): Promise<TemporaryRentSubcategory> => {
        const response = await api.post(`/temporary-rent/admin/categories/${categoryId}/subcategories`, data);
        return response.data;
    },

    updateTemporaryRentSubcategory: async (subcategoryId: string, data: UpdateAdminSubcategoryRequest): Promise<TemporaryRentSubcategory> => {
        const response = await api.patch(`/temporary-rent/admin/subcategories/${subcategoryId}`, data);
        return response.data;
    },

    archiveTemporaryRentSubcategory: async (subcategoryId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/temporary-rent/admin/subcategories/${subcategoryId}`);
        return response.data;
    },

    listTemporaryRentPriceModels: async (): Promise<TemporaryRentPriceModel[]> => {
        const response = await api.get("/temporary-rent/admin/price-models");
        return response.data;
    },

    createTemporaryRentPriceModel: async (data: CreateAdminPriceModelRequest): Promise<TemporaryRentPriceModel> => {
        const response = await api.post("/temporary-rent/admin/price-models", data);
        return response.data;
    },

    updateTemporaryRentPriceModel: async (priceModelId: string, data: UpdateAdminPriceModelRequest): Promise<TemporaryRentPriceModel> => {
        const response = await api.patch(`/temporary-rent/admin/price-models/${priceModelId}`, data);
        return response.data;
    },

    getTemporaryRentSubcategoryPriceModels: async (subcategoryId: string): Promise<TemporaryRentPriceModel[]> => {
        const response = await api.get(`/temporary-rent/admin/subcategories/${subcategoryId}/price-models`);
        return response.data;
    },

    assignTemporaryRentPriceModels: async (subcategoryId: string, priceModelIds: string[]): Promise<TemporaryRentPriceModel[]> => {
        const response = await api.put(`/temporary-rent/admin/subcategories/${subcategoryId}/price-models`, { priceModelIds });
        return response.data;
    },

    getTemporaryRentAttributes: async (subcategoryId: string): Promise<TemporaryRentAttributeDefinition[]> => {
        const response = await api.get(`/temporary-rent/admin/subcategories/${subcategoryId}/attributes`);
        return response.data;
    },

    createTemporaryRentAttribute: async (subcategoryId: string, data: CreateAdminAttributeRequest): Promise<TemporaryRentAttributeDefinition> => {
        const response = await api.post(`/temporary-rent/admin/subcategories/${subcategoryId}/attributes`, data);
        return response.data;
    },

    updateTemporaryRentAttribute: async (subcategoryId: string, attributeId: string, data: UpdateAdminAttributeRequest): Promise<TemporaryRentAttributeDefinition> => {
        const response = await api.patch(`/temporary-rent/admin/subcategories/${subcategoryId}/attributes/${attributeId}`, data);
        return response.data;
    },

    deleteTemporaryRentAttribute: async (subcategoryId: string, attributeId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/temporary-rent/admin/subcategories/${subcategoryId}/attributes/${attributeId}`);
        return response.data;
    },

    // Admin Listing Creation
    createAd: async (data: AdminCreateAdRequest) => {
        const response = await api.post("/ads/admin/create", data);
        return response.data;
    },

    createTemporaryRent: async (data: AdminCreateTemporaryRentRequest) => {
        const response = await api.post("/temporary-rent/admin/create", data);
        return response.data;
    },

    // ── Archive Management ───────────────────────────────────────────────────
    listArchivedCategories: async (): Promise<ListArchivedCategoriesResponse> => {
        const response = await api.get<ListArchivedCategoriesResponse>("/admin/archive/categories");
        return response.data;
    },

    restoreCategory: async (categoryId: string): Promise<void> => {
        await api.post(`/admin/archive/categories/${categoryId}/restore`);
    },

    forceDeleteCategory: async (categoryId: string): Promise<void> => {
        await api.delete(`/admin/archive/categories/${categoryId}/force`);
    },

    restoreSubcategory: async (subcategoryId: string): Promise<void> => {
        await api.post(`/admin/archive/subcategories/${subcategoryId}/restore`);
    },

    forceDeleteSubcategory: async (subcategoryId: string): Promise<void> => {
        await api.delete(`/admin/archive/subcategories/${subcategoryId}/force`);
    },

    // ── Real Estate Applications & Agencies Management ──────────────────────
    listAgencyApplications: async (params: {
        status?: string;
        agentType?: string;
        page?: number;
        limit?: number;
    } = {}) => {
        const response = await api.get("/admin/agency-applications", { params });
        return response.data;
    },

    getAgencyApplication: async (applicationId: string) => {
        const response = await api.get(`/admin/agency-applications/${applicationId}`);
        return response.data;
    },

    reviewAgencyApplication: async (
        applicationId: string,
        data: ReviewAgentApplicationRequest,
    ) => {
        const response = await api.post(
            `/admin/agency-applications/${applicationId}/review`,
            data,
        );
        return response.data;
    },

    listAdminAgencies: async (params: {
        agencyType?: string;
        verificationStatus?: string;
        isActive?: boolean;
        cityId?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<AdminAgenciesListResponse> => {
        const response = await api.get<AdminAgenciesListResponse>("/admin/agencies", { params });
        return response.data;
    },

    setAgencyActiveStatus: async (agencyId: string, isActive: boolean) => {
        const response = await api.patch(`/admin/agencies/${agencyId}/status`, { isActive });
        return response.data;
    },

    setAgencyVerificationStatus: async (
        agencyId: string,
        verificationStatus: string,
    ) => {
        const response = await api.patch(
            `/admin/agencies/${agencyId}/verification`,
            { verificationStatus },
        );
        return response.data;
    },

    // ── Host Applications (Landlord) Management ──────────────────────────────
    listHostApplications: async (params?: {
        status?: string;
        search?: string;
    }): Promise<HostApplicationResponse[]> => {
        const response = await api.get("/admin/host-applications", { params });
        return response.data?.data || response.data;
    },

    getHostApplication: async (id: string): Promise<HostApplicationResponse> => {
        const response = await api.get(`/admin/host-applications/${id}`);
        return response.data?.data || response.data;
    },

    reviewHostApplication: async (
        id: string,
        data: ReviewHostApplicationRequest,
    ): Promise<HostApplicationResponse> => {
        const response = await api.post(
            `/admin/host-applications/${id}/review`,
            data,
        );
        return response.data?.data || response.data;
    },
};

