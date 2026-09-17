export type ZoneType = 'PROVINCE' | 'COUNTY' | 'CITY' | 'DISTRICT' | 'RURAL_DISTRICT' | 'NEIGHBORHOOD' | 'CUSTOM';

export interface ZoneSummary {
    id: string;
    name: string;
    type?: ZoneType;
    status?: string;
    geoProvinceId?: number | null;
    geoCityId?: number | null;
    geoDistrictId?: number | null;
    geoRuralDistrictId?: number | null;
    centerPoint?: {
        latitude: number;
        longitude: number;
    };
    parentZoneId: string | null;
}

export interface ListZonesParams {
    parentId?: string;
    type?: ZoneType;
    types?: string;
    provinceId?: number;
    cityId?: number;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface ListZonesResponse {
    zones: ZoneSummary[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export interface CitySummary {
    id: string;
    name: string;
    nameEn?: string;
    geoCityId?: number;
    isCapital?: boolean;
    isCountySeat?: boolean;
    role?: 'PROVINCIAL_CAPITAL' | 'COUNTY_SEAT' | 'CITY' | string;
    rank?: number;
    osmId?: number | string;
    osmType?: string;
    osmUrl?: string;
    wikidataId?: string;
    geonamesId?: string;
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
    nameEn?: string;
    capitalName?: string;
    capitalNameEn?: string;
    geoProvinceId?: number;
    osmId?: number | string;
    osmType?: string;
    osmUrl?: string;
    centerPoint?: {
        latitude: number;
        longitude: number;
    };
    cities: CitySummary[];
}

export interface GetGeoHierarchyParams {
    page?: number;
    limit?: number;
    search?: string;
    provinceId?: number;
}

export interface GeoHierarchyResponse {
    provinces: ProvinceHierarchy[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}
