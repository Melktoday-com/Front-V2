import type { GeoCoordinates, GeoReference, ResolvedLocation } from '@/types/location.types';

/**
 * Type guard to check if an object is already a canonical ResolvedLocation.
 */
export function isResolvedLocation(val: unknown): val is ResolvedLocation {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  return 'coordinates' in obj && 'city' in obj && 'neighbourhood' in obj;
}

/**
 * Extracts numeric floor area (متراژ in square meters) from an ad or attributes object.
 * Strictly separates physical floor area from geographic neighborhood.
 */
export function getFloorArea(source: unknown): number | null {
  if (!source || typeof source !== 'object') return null;
  const s = source as Record<string, unknown>;

  if (s.attributes && typeof s.attributes === 'object') {
    const attrs = s.attributes as Record<string, unknown>;
    const numAttrs = (attrs.number && typeof attrs.number === 'object' ? attrs.number : {}) as Record<string, unknown>;
    if (typeof numAttrs.area === 'number' && !isNaN(numAttrs.area)) return numAttrs.area;
    if (typeof numAttrs.metraj === 'number' && !isNaN(numAttrs.metraj)) return numAttrs.metraj;
    if (typeof numAttrs.meter === 'number' && !isNaN(numAttrs.meter)) return numAttrs.meter;

    if (typeof attrs.area === 'number' && !isNaN(attrs.area)) return attrs.area;
    if (typeof attrs.metraj === 'number' && !isNaN(attrs.metraj)) return attrs.metraj;
    if (typeof attrs.meter === 'number' && !isNaN(attrs.meter)) return attrs.meter;
    if (typeof attrs.area === 'string' && !isNaN(Number(attrs.area))) return Number(attrs.area);
  }

  if (typeof s.area === 'number' && !isNaN(s.area)) {
    return s.area;
  }

  return null;
}

/**
 * Maps search engine listing documents (with internal _geo) to the canonical ResolvedLocation contract.
 * Keeps Meilisearch infrastructure fields strictly isolated at the boundary.
 */
export function mapSearchDocToLocation(doc: {
  _geo?: { lat: number; lng: number } | null;
  geo?: {
    cityId?: string | null;
    cityName?: string | null;
    neighbourhoodName?: string | null;
    zoneIds?: string[];
    provinceId?: number | null;
    provinceName?: string | null;
  } | null;
}): ResolvedLocation {
  const hasCoords =
    doc._geo &&
    typeof doc._geo.lat === 'number' &&
    typeof doc._geo.lng === 'number' &&
    !isNaN(doc._geo.lat) &&
    !isNaN(doc._geo.lng) &&
    !(doc._geo.lat === 0 && doc._geo.lng === 0);

  const coordinates: GeoCoordinates | null = hasCoords
    ? { latitude: doc._geo!.lat, longitude: doc._geo!.lng }
    : null;

  const city: GeoReference | null = doc.geo?.cityName?.trim()
    ? { id: doc.geo.cityId || '', name: doc.geo.cityName.trim() }
    : null;

  const neighbourhood: GeoReference | null = doc.geo?.neighbourhoodName?.trim()
    ? {
        id: (doc.geo.zoneIds && doc.geo.zoneIds[0]) || '',
        name: doc.geo.neighbourhoodName.trim(),
      }
    : null;

  const province: GeoReference | null = doc.geo?.provinceName?.trim()
    ? {
        id: doc.geo.provinceId ? String(doc.geo.provinceId) : '',
        name: doc.geo.provinceName.trim(),
      }
    : null;

  return {
    coordinates,
    city,
    neighbourhood,
    province,
  };
}

/**
 * Maps map markers to the canonical ResolvedLocation contract.
 */
export function mapMarkerToLocation(marker: {
  id?: string;
  latitude: number;
  longitude: number;
  cityName?: string | null;
  neighbourhoodName?: string | null;
}): ResolvedLocation {
  const hasCoords =
    typeof marker.latitude === 'number' &&
    typeof marker.longitude === 'number' &&
    !isNaN(marker.latitude) &&
    !isNaN(marker.longitude) &&
    !(marker.latitude === 0 && marker.longitude === 0);

  return {
    coordinates: hasCoords
      ? { latitude: marker.latitude, longitude: marker.longitude }
      : null,
    city: marker.cityName?.trim()
      ? { id: '', name: marker.cityName.trim() }
      : null,
    neighbourhood: marker.neighbourhoodName?.trim()
      ? { id: '', name: marker.neighbourhoodName.trim() }
      : null,
    province: null,
  };
}

/**
 * Formats a canonical ResolvedLocation into human-readable Persian display.
 * E.g. "مشهد، هاشمیه" or "تهران" or "هاشمیه".
 */
export function formatLocationDisplay(
  source: ResolvedLocation | { location?: ResolvedLocation | null } | string | null | undefined,
  fallback = 'موقعیت نامشخص',
): string {
  if (!source) return fallback;
  if (typeof source === 'string') return source.trim() || fallback;
  const loc: ResolvedLocation =
    'location' in source && source.location ? source.location : (source as ResolvedLocation);

  const cityName = loc.city?.name?.trim();
  const neighbourhoodName = loc.neighbourhood?.name?.trim();

  if (cityName && neighbourhoodName) {
    if (cityName === neighbourhoodName) return cityName;
    return `${cityName}، ${neighbourhoodName}`;
  }

  if (neighbourhoodName) return neighbourhoodName;
  if (cityName) return cityName;

  return fallback;
}

/**
 * Boundary normalizer for converting any incoming structure to canonical ResolvedLocation.
 */
export function normalizeLocation(source: unknown): ResolvedLocation {
  if (!source) {
    return { coordinates: null, city: null, neighbourhood: null, province: null };
  }

  if (typeof source === 'string') {
    const parts = source.split(/[،,]/).map((p) => p.trim()).filter(Boolean);
    const cityName = parts[0] || '';
    const neighbourhoodName = parts[1] || '';
    return {
      coordinates: null,
      city: cityName ? { id: '', name: cityName } : null,
      neighbourhood: neighbourhoodName ? { id: '', name: neighbourhoodName } : null,
      province: null,
    };
  }

  if (typeof source !== 'object') {
    return { coordinates: null, city: null, neighbourhood: null, province: null };
  }

  const s = source as Record<string, unknown>;

  if (isResolvedLocation(s)) {
    return s;
  }

  if (s.location && isResolvedLocation(s.location)) {
    return s.location;
  }

  if (s.resolvedLocation && isResolvedLocation(s.resolvedLocation)) {
    return s.resolvedLocation;
  }

  if ('_geo' in s || 'geo' in s) {
    return mapSearchDocToLocation(s as any);
  }

  if ('latitude' in s && 'longitude' in s) {
    return mapMarkerToLocation(s as any);
  }

  return { coordinates: null, city: null, neighbourhood: null, province: null };
}
