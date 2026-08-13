import 'server-only'
import { brand } from '@/lib/config/brand'
import { encodePolyline } from '../polyline'
import { toApproximateName } from '../approximate'
import { GeoProviderError, type GeoProvider, type GeocodeResult, type LatLng, type RouteResult } from '../types'

/**
 * Default provider: OpenStreetMap Nominatim (geocoding) + OSRM (routing) +
 * raster OSM tiles (map display). Free, no API key required. The public demo
 * endpoints below are rate-limited and NOT for production traffic — self
 * host Nominatim/OSRM or point these env vars at a hosted alternative before
 * launch. See README "Kort- og geokodningsudbyder".
 */

const NOMINATIM_BASE = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org'
const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org'
const OSM_TILE_URL = process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// Nominatim's usage policy requires a real identifying User-Agent; this call
// only ever runs server-side (server actions / route handlers) so we control
// the header, unlike a browser fetch.
const USER_AGENT = `${brand.name}/1.0 (${brand.supportEmail})`

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

async function search(query: string, opts?: { limit?: number }): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return []

  const url = new URL(`${NOMINATIM_BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'dk')
  url.searchParams.set('limit', String(opts?.limit ?? 6))

  let res: Response
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' })
  } catch (err) {
    throw new GeoProviderError('geocoding_network_error', err)
  }
  if (!res.ok) {
    throw new GeoProviderError(`geocoding_failed_${res.status}`)
  }

  const data = (await res.json()) as NominatimResult[]

  return data.map((d) => ({
    label: d.display_name,
    approximateName: toApproximateName(d.address ?? {}, d.display_name.split(',')[0]?.trim() ?? d.display_name),
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }))
}

interface OsrmResponse {
  code: string
  routes: {
    distance: number
    duration: number
    geometry: { coordinates: [number, number][] }
  }[]
}

async function route(waypoints: LatLng[]): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new GeoProviderError('route_requires_at_least_two_points')
  }

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';')
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`

  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch (err) {
    throw new GeoProviderError('routing_network_error', err)
  }
  if (!res.ok) {
    throw new GeoProviderError(`routing_failed_${res.status}`)
  }

  const data = (await res.json()) as OsrmResponse
  const bestRoute = data.routes?.[0]
  if (data.code !== 'Ok' || !bestRoute) {
    throw new GeoProviderError('no_route_found')
  }

  const points: LatLng[] = bestRoute.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))

  return {
    distanceKm: Math.round((bestRoute.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(bestRoute.duration / 60),
    polyline: encodePolyline(points),
    points,
  }
}

function getMapDisplayConfig() {
  return {
    type: 'raster' as const,
    tileUrl: OSM_TILE_URL,
    attribution: '© OpenStreetMap-bidragydere',
    maxZoom: 19,
  }
}

export const osmProvider: GeoProvider = {
  name: 'osm',
  search,
  route,
  getMapDisplayConfig,
}
