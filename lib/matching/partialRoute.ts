import { haversineDistanceKm } from '../geo/haversine'
import type { LatLng } from '../geo/types'

/**
 * Pure TypeScript mirror of the search_rides_partial_match PostGIS RPC in
 * supabase/migrations/20260101000009_matching_rpc.sql. The two must stay
 * behaviourally equivalent — this copy exists so the matching algorithm
 * (spec §11) can be unit-tested without a live Postgres/PostGIS instance.
 * The real search query in production always goes through the SQL RPC for
 * performance; this is not called from application code.
 */

export interface RoutePoint extends LatLng {
  sequence: number
  distanceFromOriginKm?: number
}

export interface PartialMatchInput {
  /** Ordered from the ride's origin (low sequence) to destination (high sequence). */
  routePoints: RoutePoint[]
  searchOrigin: LatLng
  searchDestination: LatLng
  radiusKm: number
}

export interface PartialMatchResult {
  isMatch: boolean
  originDistanceKm?: number
  destinationDistanceKm?: number
  originSequence?: number
  destinationSequence?: number
}

export function findPartialMatch(input: PartialMatchInput): PartialMatchResult {
  const { routePoints, searchOrigin, searchDestination, radiusKm } = input

  // Earliest (lowest-sequence) route point within radius of the search origin —
  // mirrors `min(rp.sequence)` in the SQL origin_candidates CTE.
  let origin: { sequence: number; distanceKm: number } | undefined
  // Latest (highest-sequence) route point within radius of the search destination —
  // mirrors `max(rp.sequence)` in the SQL dest_candidates CTE.
  let destination: { sequence: number; distanceKm: number } | undefined

  for (const point of routePoints) {
    const originDist = haversineDistanceKm(point, searchOrigin)
    if (originDist <= radiusKm) {
      if (!origin || point.sequence < origin.sequence) {
        origin = { sequence: point.sequence, distanceKm: originDist }
      } else if (point.sequence === origin.sequence) {
        origin.distanceKm = Math.min(origin.distanceKm, originDist)
      }
    }

    const destDist = haversineDistanceKm(point, searchDestination)
    if (destDist <= radiusKm) {
      if (!destination || point.sequence > destination.sequence) {
        destination = { sequence: point.sequence, distanceKm: destDist }
      } else if (point.sequence === destination.sequence) {
        destination.distanceKm = Math.min(destination.distanceKm, destDist)
      }
    }
  }

  if (!origin || !destination || origin.sequence >= destination.sequence) {
    return { isMatch: false }
  }

  return {
    isMatch: true,
    originDistanceKm: Math.round(origin.distanceKm * 10) / 10,
    destinationDistanceKm: Math.round(destination.distanceKm * 10) / 10,
    originSequence: origin.sequence,
    destinationSequence: destination.sequence,
  }
}

/** Samples a full route polyline geometry down to evenly-spaced points for storage in ride_route_points. */
export function sampleRoutePoints(points: LatLng[], intervalKm: number): RoutePoint[] {
  if (points.length === 0) return []
  const sampled: RoutePoint[] = [{ ...points[0]!, sequence: 0, distanceFromOriginKm: 0 }]

  let distanceSinceLastSample = 0
  let totalDistanceKm = 0
  let sequence = 1

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const legDistance = haversineDistanceKm(prev, curr)
    distanceSinceLastSample += legDistance
    totalDistanceKm += legDistance

    if (distanceSinceLastSample >= intervalKm) {
      sampled.push({ ...curr, sequence: sequence++, distanceFromOriginKm: Math.round(totalDistanceKm * 10) / 10 })
      distanceSinceLastSample = 0
    }
  }

  const last = points[points.length - 1]!
  const lastSampled = sampled[sampled.length - 1]!
  if (lastSampled.lat !== last.lat || lastSampled.lng !== last.lng) {
    sampled.push({ ...last, sequence: sequence, distanceFromOriginKm: Math.round(totalDistanceKm * 10) / 10 })
  }

  return sampled
}
