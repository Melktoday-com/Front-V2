import { JsonObject } from "../common";

export interface TemporaryRentAd extends JsonObject {
    id: string;
    title: string;
    description?: string;
    price: number;
    // Add other fields as needed based on backend
}

export interface TemporaryRentContactInfo extends JsonObject {
    phoneNumber: string;
    ownerName?: string;
}