/**
 * Map/geocoding/routing provider abstraction (spec §2). The rest of the app
 * (server actions, ride creation, search, map display) only ever talks to
 * these interfaces — never to a specific vendor's SDK/API directly — so the
 * provider can be swapped later by adding a new file under lib/geo/providers
 * and changing NEXT_PUBLIC_MAP_PROVIDER. See lib/geo/index.ts.
 */

export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodeResult {
  /** Full label as returned by the provider, shown in autocomplete dropdowns. */
  label: string
  /** Short, human-friendly approximation safe to show publicly (e.g. "Roskilde", "København SV"). */
  approximateName: string
  lat: number
  lng: number
}

export interface RouteResult {
  distanceKm: number
  durationMinutes: number
  /** Encoded polyline (Google/OSRM precision-5 algorithm) — see lib/geo/polyline.ts. */
  polyline: string
  /** Full ordered geometry, used to sample ride_route_points for partial-route matching. */
  points: LatLng[]
}

export interface MapTileConfig {
  type: 'raster'
  tileUrl: string
  attribution: string
  maxZoom?: number
}

export interface MapStyleConfig {
  type: 'style'
  styleUrl: string
}

export type MapDisplayConfig = MapTileConfig | MapStyleConfig

export interface GeoProvider {
  readonly name: string
  search(query: string, opts?: { limit?: number }): Promise<GeocodeResult[]>
  route(waypoints: LatLng[]): Promise<RouteResult>
  getMapDisplayConfig(): MapDisplayConfig
}

export class GeoProviderError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'GeoProviderError'
  }
}
