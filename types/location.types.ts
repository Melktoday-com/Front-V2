export interface GeoReference {
  id: string;
  name: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface ResolvedLocation {
  coordinates: GeoCoordinates | null;
  city: GeoReference | null;
  neighbourhood: GeoReference | null;
  province?: GeoReference | null;
}
