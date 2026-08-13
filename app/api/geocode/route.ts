import { NextResponse, type NextRequest } from 'next/server'
import { geo, GeoProviderError } from '@/lib/geo'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

/**
 * Thin server-side proxy to the geocoding provider (spec §2) — the provider
 * itself is 'server-only' (sets a custom User-Agent per Nominatim's usage
 * policy, which a browser fetch can't do), so autocomplete inputs call this
 * route instead of the provider directly. Rate limited per IP since the
 * default OSM provider forwards to a shared public service.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`geocode:${ip}`, 30, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'For mange søgninger. Vent et øjeblik.' }, { status: 429 })
  }

  try {
    const results = await geo.search(query, { limit: 6 })
    return NextResponse.json({ results })
  } catch (err) {
    console.error('geocode_failed', err instanceof GeoProviderError ? err.message : err)
    return NextResponse.json({ error: 'Kunne ikke søge efter adresser lige nu.' }, { status: 502 })
  }
}
