import 'server-only'
import { osmProvider } from './providers/osm'
import { mapboxProvider } from './providers/mapbox'
import type { GeoProvider } from './types'

export type { GeoProvider, GeocodeResult, RouteResult, LatLng, MapDisplayConfig } from './types'
export { GeoProviderError } from './types'

/**
 * Single point of provider selection for geocoding/routing (server-side
 * only). To add a provider: implement GeoProvider in lib/geo/providers/,
 * register it here, and point NEXT_PUBLIC_MAP_PROVIDER at its name — no
 * other file in the app imports a provider directly.
 */
function selectProvider(): GeoProvider {
  const configured = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm'
  switch (configured) {
    case 'mapbox':
      return mapboxProvider
    case 'osm':
    default:
      return osmProvider
  }
}

export const geo = selectProvider()
