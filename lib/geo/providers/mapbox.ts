import 'server-only'
import { encodePolyline } from '../polyline'
import { GeoProviderError, type GeoProvider, type GeocodeResult, type LatLng, type RouteResult } from '../types'

/**
 * Mapbox provider stub — implements the same GeoProvider interface as
 * lib/geo/providers/osm.ts so switching NEXT_PUBLIC_MAP_PROVIDER=mapbox (and
 * setting MAPBOX_TOKEN/NEXT_PUBLIC_MAPBOX_TOKEN) is a drop-in swap with no
 * other code changes. Inactive by default; throws clearly if selected
 * without a token rather than failing silently. Not exercised by the MVP's
 * default configuration or its tests.
 */

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN

function assertConfigured() {
  if (!MAPBOX_TOKEN) {
    throw new GeoProviderError('mapbox_provider_selected_without_token')
  }
}

async function search(query: string, opts?: { limit?: number }): Promise<GeocodeResult[]> {
  assertConfigured()
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
  url.searchParams.set('access_token', MAPBOX_TOKEN!)
  url.searchParams.set('country', 'dk')
  url.searchParams.set('limit', String(opts?.limit ?? 6))

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new GeoProviderError(`geocoding_failed_${res.status}`)
  const data = await res.json()

  return (data.features ?? []).map((f: { place_name: string; text: string; center: [number, number] }) => ({
    label: f.place_name,
    approximateName: f.text,
    lat: f.center[1],
    lng: f.center[0],
  }))
}

async function route(waypoints: LatLng[]): Promise<RouteResult> {
  assertConfigured()
  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';')
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`)
  url.searchParams.set('access_token', MAPBOX_TOKEN!)
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new GeoProviderError(`routing_failed_${res.status}`)
  const data = await res.json()
  const bestRoute = data.routes?.[0]
  if (!bestRoute) throw new GeoProviderError('no_route_found')

  const points: LatLng[] = bestRoute.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))

  return {
    distanceKm: Math.round((bestRoute.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(bestRoute.duration / 60),
    polyline: encodePolyline(points),
    points,
  }
}

function getMapDisplayConfig() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) throw new GeoProviderError('mapbox_provider_selected_without_public_token')
  return { type: 'style' as const, styleUrl: `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}` }
}

export const mapboxProvider: GeoProvider = {
  name: 'mapbox',
  search,
  route,
  getMapDisplayConfig,
}
