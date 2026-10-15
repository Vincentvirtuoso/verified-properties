const NG_BOUNDS = { minLat: 4.2, maxLat: 13.9, minLng: 2.6, maxLng: 14.7 };

export function isInNigeria(lat: number, lng: number) {
  return (
    lat >= NG_BOUNDS.minLat &&
    lat <= NG_BOUNDS.maxLat &&
    lng >= NG_BOUNDS.minLng &&
    lng <= NG_BOUNDS.maxLng
  );
}
