import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type RideRow = Database['public']['Tables']['rides']['Row']
type PublicProfileRow = Database['public']['Tables']['public_profiles']['Row']

export interface RideCardData extends RideRow {
  driver: Pick<
    PublicProfileRow,
    'id' | 'public_id' | 'first_name' | 'avatar_url' | 'rating_avg' | 'rating_count' | 'completed_rides_count'
  > | null
  ferryRoute: { operator: string; departure_port: string; arrival_port: string } | null
}

/**
 * Rides only store IDs (driver_id, ferry_route_id); ride cards/detail pages
 * need the driver's public profile and the ferry route's names too. Done as
 * two follow-up queries rather than a PostgREST embed, since public_profiles
 * is a view without its own FK metadata for reliable embedding.
 */
export async function enrichRides(supabase: SupabaseClient<Database>, rides: RideRow[]): Promise<RideCardData[]> {
  if (rides.length === 0) return []

  const driverIds = Array.from(new Set(rides.map((r) => r.driver_id)))
  const ferryIds = Array.from(new Set(rides.map((r) => r.ferry_route_id).filter((id): id is string => !!id)))

  const [{ data: drivers }, { data: ferries }] = await Promise.all([
    supabase.from('public_profiles').select('*').in('id', driverIds),
    ferryIds.length
      ? supabase.from('ferry_routes').select('id, operator, departure_port, arrival_port').in('id', ferryIds)
      : Promise.resolve({ data: [] as { id: string; operator: string; departure_port: string; arrival_port: string }[] }),
  ])

  const driverMap = new Map((drivers ?? []).map((d) => [d.id, d]))
  const ferryMap = new Map((ferries ?? []).map((f) => [f.id, f]))

  return rides.map((r) => ({
    ...r,
    driver: driverMap.get(r.driver_id) ?? null,
    ferryRoute: r.ferry_route_id ? ferryMap.get(r.ferry_route_id) ?? null : null,
  }))
}
