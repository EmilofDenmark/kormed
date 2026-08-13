import type { MapDisplayConfig } from './types'

/**
 * Client-safe map display config (no 'server-only' — the map component runs
 * in the browser). Deliberately reads NEXT_PUBLIC_* env vars directly rather
 * than importing lib/geo/providers/*, which pull in server-only geocoding
 * code. Keep this in sync with the provider selection in lib/geo/index.ts.
 */
export function getMapDisplayConfig(): MapDisplayConfig {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm'

  if (provider === 'mapbox') {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (token) {
      return { type: 'style', styleUrl: `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}` }
    }
  }

  return {
    type: 'raster',
    tileUrl: process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap-bidragydere',
    maxZoom: 19,
  }
}
