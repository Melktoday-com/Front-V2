import type { JsonValue } from "../common";
import type { MediaReference } from "./media.types";

export type FavoriteItemType = 'AD' | 'TEMPORARY_RENT';

export interface FavoriteItemDetails {
    price?: number | string;
    nightlyPrice?: number;
    category?: string;
    actionUrl?: string;
    location?: string;
    rooms?: number;
    maxGuests?: number;
    [key: string]: JsonValue | undefined;
}

export interface FavoriteItem {
    id: string;
    type: FavoriteItemType;
    title: string;
    subtitle?: string;
    mediaIds?: MediaReference[];
    imageIds?: string[];
    imageUrl?: string;
    referenceId?: string;
    timestamp: string;
    isSaved: boolean;
    details?: FavoriteItemDetails;
}
