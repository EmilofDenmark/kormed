import { describe, it, expect } from 'vitest'
import { findPartialMatch, sampleRoutePoints, type RoutePoint } from '@/lib/matching/partialRoute'

// Spec §36 rule 4: partial route matches must be in the correct travel direction.
describe('partial route matching', () => {
  // A route point every ~10km from København towards Aarhus, roughly along
  // the E20/E45 corridor, passing near Roskilde early on.
  const route: RoutePoint[] = [
    { sequence: 0, lat: 55.6761, lng: 12.5683 }, // København (origin)
    { sequence: 1, lat: 55.6415, lng: 12.0803 }, // Roskilde
    { sequence: 2, lat: 55.6, lng: 11.5 },
    { sequence: 3, lat: 55.7, lng: 11.0 },
    { sequence: 4, lat: 55.97, lng: 10.5 },
    { sequence: 5, lat: 56.1629, lng: 10.2039 }, // Aarhus (destination)
  ]

  it('matches a passenger going from a midpoint (Roskilde) to the final destination (Aarhus)', () => {
    const result = findPartialMatch({
      routePoints: route,
      searchOrigin: { lat: 55.6415, lng: 12.0803 }, // Roskilde
      searchDestination: { lat: 56.1629, lng: 10.2039 }, // Aarhus
      radiusKm: 15,
    })
    expect(result.isMatch).toBe(true)
    expect(result.originSequence).toBe(1)
    expect(result.destinationSequence).toBe(5)
  })

  it('rejects the same two points in the REVERSE travel direction (Aarhus -> Roskilde)', () => {
    const result = findPartialMatch({
      routePoints: route,
      searchOrigin: { lat: 56.1629, lng: 10.2039 }, // Aarhus
      searchDestination: { lat: 55.6415, lng: 12.0803 }, // Roskilde
      radiusKm: 15,
    })
    expect(result.isMatch).toBe(false)
  })

  it('rejects a search point far outside the configured radius', () => {
    const result = findPartialMatch({
      routePoints: route,
      searchOrigin: { lat: 55.6761, lng: 12.5683 },
      searchDestination: { lat: 57.048, lng: 9.9217 }, // Aalborg — not on this route at all
      radiusKm: 15,
    })
    expect(result.isMatch).toBe(false)
  })

  it('matches the full route end to end', () => {
    const result = findPartialMatch({
      routePoints: route,
      searchOrigin: { lat: 55.6761, lng: 12.5683 },
      searchDestination: { lat: 56.1629, lng: 10.2039 },
      radiusKm: 15,
    })
    expect(result.isMatch).toBe(true)
    expect(result.originSequence).toBe(0)
    expect(result.destinationSequence).toBe(5)
  })

  it('samples a polyline into evenly spaced points including the endpoints', () => {
    const line = Array.from({ length: 50 }, (_, i) => ({ lat: 55.6 + i * 0.01, lng: 12.0 + i * 0.005 }))
    const sampled = sampleRoutePoints(line, 5)
    expect(sampled[0]).toMatchObject({ sequence: 0, distanceFromOriginKm: 0 })
    expect(sampled[sampled.length - 1]!.lat).toBeCloseTo(line[line.length - 1]!.lat, 5)
    // Sequences must be strictly increasing (needed for direction checks).
    for (let i = 1; i < sampled.length; i++) {
      expect(sampled[i]!.sequence).toBeGreaterThan(sampled[i - 1]!.sequence)
    }
  })
})
