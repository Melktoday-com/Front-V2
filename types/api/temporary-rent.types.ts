import { JsonValue } from "../common";

export interface TemporaryRentAd {
    id: string;
    title: string;
    description?: string;
    cityId: string;
    cityName?: string;
    address?: string;
    mediaIds?: string[];
    pricing: {
        nightlyPrice: number;
    };
    guestCapacity?: number;
    location: {
        latitude: number;
        longitude: number;
    };
    owner?: {
        fullName?: string;
        avatarUrl?: string;
    };
    attributes?: {
        rooms?: number;
        bathrooms?: number;
        [key: string]: JsonValue | undefined;
    };
}

export interface TemporaryRentContactInfo {
    phoneNumber: string;
    ownerName?: string;
}