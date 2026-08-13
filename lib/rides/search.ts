import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { enrichRides, type RideCardData } from './enrich'
import { getAppSettings } from '@/lib/settings'

export interface SearchParamsInput {
  fraLat?: number
  fraLng?: number
  fraName?: string
  tilLat?: number
  tilLng?: number
  tilName?: string
  dato?: string
  passagerer?: number
  faerge?: boolean
  faergeRuteId?: string
}

export interface SearchResultRide extends RideCardData {
  originDistanceKm?: number
  destinationDistanceKm?: number
  isPartialMatch?: boolean
}

/**
 * Ordering per spec §12: route match quality, then date/time, then pickup
 * distance, then driver rating. No paid/hidden ranking of any kind.
 */
export async function searchRides(params: SearchParamsInput): Promise<SearchResultRide[]> {
  const supabase = await createClient()
  const seats = params.passagerer ?? 1

  const hasRoute =
    params.fraLat != null && params.fraLng != null && params.tilLat != null && params.tilLng != null

  if (hasRoute) {
    const settings = await getAppSettings()
    const { data: matches } = await supabase.rpc('search_rides_partial_match', {
      p_origin_lat: params.fraLat!,
      p_origin_lng: params.fraLng!,
      p_dest_lat: params.tilLat!,
      p_dest_lng: params.tilLng!,
      p_date: params.dato || null,
      p_seats: seats,
      p_radius_km: settings.searchRadiusKm,
    })

    if (!matches || matches.length === 0) return []

    const ids = matches.map((m) => m.ride_id)
    let query = supabase.from('rides').select('*').in('id', ids)
    if (params.faerge) query = query.eq('uses_ferry', true)
    if (params.faergeRuteId) query = query.eq('ferry_route_id', params.faergeRuteId)

    const { data: rides } = await query
    const enriched = await enrichRides(supabase, rides ?? [])
    const distanceByRide = new Map(matches.map((m) => [m.ride_id, m]))

    const results: SearchResultRide[] = enriched.map((r) => {
      const m = distanceByRide.get(r.id)
      return {
        ...r,
        originDistanceKm: m?.origin_distance_km,
        destinationDistanceKm: m?.destination_distance_km,
        isPartialMatch: (m?.origin_distance_km ?? 0) > 1 || (m?.destination_distance_km ?? 0) > 1,
      }
    })

    results.sort((a, b) => {
      const proximityA = (a.originDistanceKm ?? 0) + (a.destinationDistanceKm ?? 0)
      const proximityB = (b.originDistanceKm ?? 0) + (b.destinationDistanceKm ?? 0)
      if (proximityA !== proximityB) return proximityA - proximityB
      if (a.departure_date !== b.departure_date) return a.departure_date < b.departure_date ? -1 : 1
      return (b.driver?.rating_avg ?? 0) - (a.driver?.rating_avg ?? 0)
    })

    return results
  }

  // No route selected yet — plain upcoming-rides listing with basic filters.
  const today = new Date().toISOString().slice(0, 10)
  let query = supabase.from('rides').select('*').eq('status', 'PUBLISHED').gte('available_seats', seats)

  query = params.dato
    ? query.eq('departure_date', params.dato).order('departure_time', { ascending: true })
    : query.gte('departure_date', today).order('departure_date', { ascending: true })
  query = query.limit(30)

  if (params.faerge) query = query.eq('uses_ferry', true)
  if (params.faergeRuteId) query = query.eq('ferry_route_id', params.faergeRuteId)

  const { data: rides } = await query
  return enrichRides(supabase, rides ?? [])
}
