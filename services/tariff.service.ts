import apiClient from "@/lib/api/client";

export interface TariffDetail {
    key: string;
    name: string;
    description?: string;
    contentType: 'LISTING' | 'TEMPORARY_RENTAL';
    operationType: 'PUBLICATION' | 'URGENT' | 'LADDER';
    amountIrr: string;
    currency: string;
    isEnabled: boolean;
    updatedAt: string;
}

export const tariffService = {
    async getAll(): Promise<TariffDetail[]> {
        const response = await apiClient.get<TariffDetail[]>("/tariffs");
        return response.data;
    },

    async getAdminAll(): Promise<TariffDetail[]> {
        const response = await apiClient.get<TariffDetail[]>("/admin/tariffs");
        return response.data;
    },

    async updateTariff(key: string, amountIrr: string, isEnabled?: boolean): Promise<TariffDetail> {
        const response = await apiClient.put<TariffDetail>(`/admin/tariffs/${key}`, {
            amountIrr,
            isEnabled,
        });
        return response.data;
    },

    async updateAll(tariffs: Array<{ key: string; amountIrr: string; isEnabled?: boolean }>): Promise<TariffDetail[]> {
        const response = await apiClient.put<TariffDetail[]>("/admin/tariffs", {
            tariffs,
        });
        return response.data;
    },
};
