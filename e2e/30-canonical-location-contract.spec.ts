import { test, expect } from '@playwright/test';
import { normalizeLocation, formatLocationDisplay, getFloorArea } from '../lib/location';
import type { ResolvedLocation } from '../types/location.types';

test.describe('Canonical Location Contract & Architecture', () => {
  test('normalizeLocation: canonical ResolvedLocation pass-through', () => {
    const canonical: ResolvedLocation = {
      coordinates: { latitude: 36.3202, longitude: 59.5135 },
      city: { id: 'city-mashhad-1', name: 'مشهد' },
      neighbourhood: { id: 'zone-hashemiyeh-1', name: 'هاشمیه' },
      province: { id: 'prov-khorasan-1', name: 'خراسان رضوی' },
    };

    const result = normalizeLocation({ location: canonical });

    expect(result.coordinates).toEqual({ latitude: 36.3202, longitude: 59.5135 });
    expect(result.city).toEqual({ id: 'city-mashhad-1', name: 'مشهد' });
    expect(result.neighbourhood).toEqual({ id: 'zone-hashemiyeh-1', name: 'هاشمیه' });
    expect(result.province).toEqual({ id: 'prov-khorasan-1', name: 'خراسان رضوی' });

    const resultDirect = normalizeLocation(canonical);
    expect(resultDirect.coordinates).toEqual({ latitude: 36.3202, longitude: 59.5135 });
  });

  test('normalizeLocation: resolves backend ad detail payload with legacy and canonical fields', () => {
    const backendAd = {
      adId: 'ad-test-1',
      cityId: 'city-mashhad-1',
      cityName: 'مشهد',
      provinceId: 'prov-1',
      provinceName: 'خراسان رضوی',
      location: {
        latitude: 36.32,
        longitude: 59.51,
        coordinates: { latitude: 36.32, longitude: 59.51 },
        city: { id: 'city-mashhad-1', name: 'مشهد', label: 'مشهد' },
        neighbourhood: { id: 'zone-hashemiyeh-1', name: 'هاشمیه', label: 'هاشمیه' },
        area: { id: 'zone-hashemiyeh-1', label: 'هاشمیه' },
      },
      attributes: {
        area: 150, // Floor area (metraj)
        rooms: 3,
      },
    };

    const loc = normalizeLocation(backendAd);
    expect(loc.coordinates).toEqual({ latitude: 36.32, longitude: 59.51 });
    expect(loc.city?.name).toBe('مشهد');
    expect(loc.neighbourhood?.name).toBe('هاشمیه');
    expect(loc.neighbourhood?.id).toBe('zone-hashemiyeh-1');

    // Verify floor area is completely decoupled from neighborhood
    expect(getFloorArea(backendAd)).toBe(150);
  });

  test('normalizeLocation: resolves search listing hit format (_geo and geo object)', () => {
    const searchHit = {
      id: 'hit-123',
      title: 'آپارتمان در هاشمیه',
      _geo: { lat: 36.325, lng: 59.518 },
      geo: {
        cityId: 'city-mashhad-1',
        cityName: 'مشهد',
        neighbourhoodName: 'هاشمیه',
        zoneIds: ['zone-hashemiyeh-uuid'],
      },
      attributes: {
        number: {
          area: 120,
        },
      },
    };

    const loc = normalizeLocation(searchHit);
    expect(loc.coordinates).toEqual({ latitude: 36.325, longitude: 59.518 });
    expect(loc.city?.name).toBe('مشهد');
    expect(loc.neighbourhood?.name).toBe('هاشمیه');
    expect(loc.neighbourhood?.id).toBe('zone-hashemiyeh-uuid');

    // Floor area
    expect(getFloorArea({ attributes: { area: searchHit.attributes.number.area } })).toBe(120);
  });

  test('normalizeLocation: resolves map marker format (flat coords and names)', () => {
    const marker = {
      id: 'marker-1',
      latitude: 36.31,
      longitude: 59.52,
      cityName: 'مشهد',
      neighbourhoodName: 'سجاد',
    };

    const loc = normalizeLocation(marker);
    expect(loc.coordinates).toEqual({ latitude: 36.31, longitude: 59.52 });
    expect(loc.city?.name).toBe('مشهد');
    expect(loc.neighbourhood?.name).toBe('سجاد');
    expect(formatLocationDisplay(loc)).toBe('مشهد، سجاد');
  });

  test('normalizeLocation: safely handles missing or (0,0) coordinates and empty location', () => {
    const zeroCoords = {
      latitude: 0,
      longitude: 0,
      cityName: 'تهران',
    };
    const locZero = normalizeLocation(zeroCoords);
    expect(locZero.coordinates).toBeNull();
    expect(locZero.city?.name).toBe('تهران');
    expect(locZero.neighbourhood).toBeNull();

    const empty = normalizeLocation(null);
    expect(empty.coordinates).toBeNull();
    expect(empty.city).toBeNull();
    expect(empty.neighbourhood).toBeNull();
    expect(formatLocationDisplay(empty, 'موقعیت نامشخص')).toBe('موقعیت نامشخص');
  });

  test('getFloorArea: never returns neighborhood object as numeric floor area', () => {
    // Legacy collision payload where ad.area was the neighborhood object
    const legacyCollidedAd = {
      area: { id: 'zone-123', label: 'هفت تیر' },
      attributes: {
        area: 95,
      },
    };

    expect(getFloorArea(legacyCollidedAd)).toBe(95);

    // If ad has only area object and no numeric attribute, returns null, NOT string/object
    const onlyNeighbourhoodObject = {
      area: { id: 'zone-123', label: 'هفت تیر' },
      attributes: {},
    };
    expect(getFloorArea(onlyNeighbourhoodObject)).toBeNull();
  });

  test('formatLocationDisplay: formats Persian strings correctly without duplicates', () => {
    expect(
      formatLocationDisplay({
        city: { id: '1', name: 'مشهد' },
        neighbourhood: { id: '2', name: 'هاشمیه' },
        coordinates: null,
      })
    ).toBe('مشهد، هاشمیه');

    expect(
      formatLocationDisplay({
        city: { id: '1', name: 'مشهد' },
        neighbourhood: { id: '1', name: 'مشهد' },
        coordinates: null,
      })
    ).toBe('مشهد');

    expect(
      formatLocationDisplay({
        city: { id: '1', name: 'مشهد' },
        neighbourhood: null,
        coordinates: null,
      })
    ).toBe('مشهد');

    expect(
      formatLocationDisplay({
        city: null,
        neighbourhood: { id: '2', name: 'هاشمیه' },
        coordinates: null,
      })
    ).toBe('هاشمیه');
  });
});

test.describe('Live Backend Location API Contracts', () => {
  test('GET /api/search/listings returns geo.zoneIds and coordinates', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/search/listings?limit=5');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.hits)).toBe(true);

    if (body.data.hits.length > 0) {
      const hit = body.data.hits[0];
      expect(hit).toHaveProperty('id');
      expect(hit).toHaveProperty('title');
      if (hit.geo) {
        expect(hit.geo).toHaveProperty('zoneIds');
        expect(Array.isArray(hit.geo.zoneIds)).toBe(true);
      }
      if (hit._geo) {
        expect(typeof hit._geo.lat).toBe('number');
        expect(typeof hit._geo.lng).toBe('number');
      }
    }
  });

  test('GET /api/search/map returns clustered or discrete markers', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/search/map?zoom=13');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('clusters');
    expect(body.data).toHaveProperty('markers');
    expect(Array.isArray(body.data.clusters)).toBe(true);
    expect(Array.isArray(body.data.markers)).toBe(true);
  });

  test('GET /api/geo/zones?type=NEIGHBORHOOD returns authoritative neighborhood polygons', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/geo/zones?type=NEIGHBORHOOD&limit=10');
    expect(res.status()).toBe(200);

    const body = await res.json();
    const zones = body.data.zones || body.data.items;
    expect(Array.isArray(zones)).toBe(true);

    for (const item of zones) {
      expect(item.type).toBe('NEIGHBORHOOD');
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  test('GET /api/ads returns canonical location and strictly no legacy duplicates', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/ads?limit=5');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);

    if (body.data.items.length > 0) {
      for (const ad of body.data.items) {
        expect(ad.resolvedLocation).toBeUndefined();
        if (ad.location) {
          expect(ad.location.area).toBeUndefined();
          expect(ad.location.latitude).toBeUndefined();
          expect(ad.location.longitude).toBeUndefined();
          if (ad.location.coordinates) {
            expect(typeof ad.location.coordinates.latitude).toBe('number');
            expect(typeof ad.location.coordinates.longitude).toBe('number');
          }
          if (ad.location.city) {
            expect(typeof ad.location.city.name).toBe('string');
          }
          if (ad.location.neighbourhood) {
            expect(typeof ad.location.neighbourhood.name).toBe('string');
          }
        }
      }
    }
  });

  test('GET /api/temporary-rent returns canonical location and strictly no legacy duplicates', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/temporary-rent?limit=5');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    const items = body.data.items || body.data;
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        expect(item.resolvedLocation).toBeUndefined();
        if (item.location) {
          expect(item.location.area).toBeUndefined();
          expect(item.location.latitude).toBeUndefined();
          expect(item.location.longitude).toBeUndefined();
        }
      }
    }
  });
});

