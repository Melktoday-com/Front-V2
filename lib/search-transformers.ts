import { mapSearchDocToLocation, getFloorArea } from '@/lib/location';
import { AdSummary } from '@/types/api/ads.types';
import { AdStatus } from '@/types/api/enums';
import { ListingSearchDocument } from '@/types/api/search.types';

/**
 * Transforms a Meilisearch ListingSearchDocument into a canonical AdSummary.
 *
 * Authoritative promotion ranking scores defined in backend `OnPromotionActivatedHandler`:
 *  - URGENT_TAG active: 80
 *  - PIN active: 60
 *  - LADDER active: 40
 *  - BANNER active: 20
 *  - No active promotion: 0
 */
export function searchDocToAdSummary(doc: ListingSearchDocument): AdSummary {
  const primaryPrice = doc.pricing?.number?.price ?? doc.pricing?.number?.totalPrice ?? 0;
  const location = mapSearchDocToLocation(doc);
  const rooms = doc.attributes?.number?.rooms || doc.attributes?.number?.bedrooms || doc.attributes?.number?.room;
  const floorArea = getFloorArea(doc);

  const isUrgent = doc.promotionBoostScore === 80;
  const isLadder = doc.promotionBoostScore === 40;
  const isFeatured = Boolean(doc.isFeatured && !isLadder && !isUrgent);
  const effectiveDate = isLadder
    ? (doc.updatedAt || doc.publishedAt || doc.createdAt)
    : (doc.publishedAt || doc.createdAt);

  return {
    adId: doc.id,
    ownerId: doc.ownerId,
    cityId: doc.geo?.cityId || location.city?.id || "",
    cityName: location.city?.name,
    status: AdStatus.PUBLISHED,
    title: doc.title,
    categoryPath: {
      categoryKey: doc.taxonomy.categoryId,
      subcategoryKey: doc.taxonomy.subcategoryId || "",
      businessModelKey: doc.taxonomy.businessModelId || "",
      attributeSchemaVersion: 1,
      categoryTitle: doc.taxonomy.categoryName,
      subcategoryTitle: doc.taxonomy.subcategoryName,
    },
    categoryTitle: doc.taxonomy.categoryName,
    subcategoryTitle: doc.taxonomy.subcategoryName,
    pricing: doc.pricing?.number || (primaryPrice > 0 ? { price: primaryPrice } : {}),
    isFeatured,
    isUrgent,
    isLadder,
    mediaIds: doc.mediaIds || [],
    createdAt: effectiveDate,
    location,
    area: floorArea ?? undefined,
    rooms: typeof rooms === "number" ? rooms : undefined,
  };
}
