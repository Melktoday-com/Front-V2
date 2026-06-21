export interface ZoneSummary {
    id: string;
    name: string;
    centerPoint: {
        latitude: number;
        longitude: number;
    };
    parentZoneId: string | null;
}

export interface ListZonesResponse {
    zones: ZoneSummary[];
    total: number;
}
