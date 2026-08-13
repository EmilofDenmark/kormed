import type { LatLng } from './types'

/**
 * Privacy safeguard for map display (spec §5): never plot a user's exact
 * point on a public map. Rounding to 2 decimal degrees is roughly ±1km in
 * Denmark — enough to show "which town", never "which house". This is only
 * for what gets drawn on screen; routing/distance calculations elsewhere use
 * the precise stored coordinates.
 */
export function roundForDisplay(point: LatLng, precision = 2): LatLng {
  const factor = 10 ** precision
  return {
    lat: Math.round(point.lat * factor) / factor,
    lng: Math.round(point.lng * factor) / factor,
  }
}

interface NominatimAddress {
  suburb?: string
  city_district?: string
  town?: string
  village?: string
  city?: string
  municipality?: string
  county?: string
  state?: string
}

/**
 * Turns a full geocoding result into a coarse, public-safe place name (e.g.
 * "Roskilde", "København SV") — this is what gets stored as a ride's
 * origin_name/destination_name and shown on ride cards, never a street
 * address (spec §4/§5/§23).
 */
export function toApproximateName(address: NominatimAddress, fallback: string): string {
  const name =
    address.suburb ||
    address.city_district ||
    address.town ||
    address.village ||
    address.city ||
    address.municipality ||
    address.county
  return name || fallback
}
