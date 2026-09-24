export type ZoneType = 'PROVINCE' | 'COUNTY' | 'CITY' | 'DISTRICT' | 'RURAL_DISTRICT' | 'NEIGHBORHOOD' | 'CUSTOM';

export interface GeoCenterPoint {
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
}

export interface ZoneSummary {
    id: string;
    name: string;
    type?: ZoneType;
    status?: string;
    geoProvinceId?: number | null;
    geoCityId?: number | null;
    geoDistrictId?: number | null;
    geoRuralDistrictId?: number | null;
    centerPoint?: GeoCenterPoint;
    parentZoneId?: string | null;
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
    centerPoint?: GeoCenterPoint;
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
    centerPoint?: GeoCenterPoint;
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

export interface ProvinceItem {
    id: string;
    name: string;
    nameEn?: string;
    capitalName?: string;
    capitalNameEn?: string;
    geoProvinceId?: number;
    geoCityId?: number | null;
    geoDistrictId?: number | null;
    geoRuralDistrictId?: number | null;
    parentZoneId?: string | null;
    osmId?: number | string;
    osmType?: string;
    osmUrl?: string;
    type?: string;
    status?: string;
}

export interface PaginatedProvincesResponse {
    items: ProvinceItem[];
    zones?: ProvinceItem[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

export interface CityItem {
    id: string;
    name: string;
    nameEn?: string;
    geoCityId?: number;
    geoProvinceId?: number;
    geoDistrictId?: number | null;
    geoRuralDistrictId?: number | null;
    parentZoneId?: string | null;
    type?: string;
    status?: string;
    isCapital?: boolean;
    isCountySeat?: boolean;
    role?: string;
    rank?: number;
    osmId?: number | string;
    osmType?: string;
    osmUrl?: string;
    wikidataId?: string;
    geonamesId?: string;
    centerPoint?: GeoCenterPoint;
}

export interface PaginatedCitiesResponse {
    items: CityItem[];
    cities?: CityItem[];
    zones?: CityItem[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

export interface UpdateZoneStatusResponse {
    success: boolean;
}
