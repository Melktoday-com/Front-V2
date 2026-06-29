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

export interface CitySummary {
    id: string;
    name: string;
    geoCityId?: number;
    centerPoint?: {
        latitude: number;
        longitude: number;
    };
    boundingBox?: {
        minLatitude: number;
        minLongitude: number;
        maxLatitude: number;
        maxLongitude: number;
    } | null;
}

export interface ProvinceHierarchy {
    id: string;
    name: string;
    geoProvinceId?: number;
    cities: CitySummary[];
}

export interface GeoHierarchyResponse {
    provinces: ProvinceHierarchy[];
}
