import { NextResponse, type NextRequest } from 'next/server'
import { geo, GeoProviderError } from '@/lib/geo'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

/**
 * Lets the ride-creation wizard show a live distance/price estimate before
 * final submit (spec §9 "systemet beregner et vejledende maksimalt bidrag").
 * The server action in lib/actions/rides.ts recomputes the route
 * authoritatively at publish time — this endpoint is a UX preview only, not
 * trusted for the actual price-cap enforcement.
 */
export async function POST(request: NextRequest) {
  const ip = await getClientIp()
  const allowed = await checkRateLimit(`route-preview:${ip}`, 20, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'For mange forespørgsler. Vent et øjeblik.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.origin || !body?.destination) {
    return NextResponse.json({ error: 'Manglende rutepunkter.' }, { status: 400 })
  }

  try {
    const route = await geo.route([body.origin, body.destination])
    return NextResponse.json({ distanceKm: route.distanceKm, durationMinutes: route.durationMinutes })
  } catch (err) {
    console.error('route_preview_failed', err instanceof GeoProviderError ? err.message : err)
    return NextResponse.json({ error: 'Kunne ikke beregne ruten lige nu.' }, { status: 502 })
  }
}
