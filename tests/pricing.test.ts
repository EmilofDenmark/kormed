import { describe, it, expect } from 'vitest'
import { computeMaxContribution, isSeatPriceWithinCap, type PricingSettings } from '@/lib/pricing/costSharing'

// Spec §36 rule 3: users cannot publish above the configured price cap.
describe('cost-sharing price cap', () => {
  const settings: PricingSettings = {
    pricePerKmDkk: 2,
    ferryCostPassThroughPct: 100,
    tollCostPassThroughPct: 100,
    roundingMethod: 'nearest_5',
  }

  it('splits the total direct cost across everyone in the car, including the driver', () => {
    const result = computeMaxContribution({
      distanceKm: 200,
      seatsOffered: 3,
      settings,
    })
    // 200km * 2kr/km = 400kr total, split 4 ways (driver + 3 passengers) = 100kr, rounds to nearest 5.
    expect(result.totalDirectCostDkk).toBe(400)
    expect(result.totalPeopleInCar).toBe(4)
    expect(result.maxContributionPerPassengerDkk).toBe(100)
  })

  it('prefers the driver-entered direct cost estimate over the distance-based fallback', () => {
    const result = computeMaxContribution({
      distanceKm: 200,
      seatsOffered: 1,
      directCostEstimateDkk: 100,
      settings,
    })
    expect(result.totalDirectCostDkk).toBe(100)
  })

  it('adds ferry and toll costs at their configured pass-through percentage', () => {
    const result = computeMaxContribution({
      distanceKm: 0,
      seatsOffered: 1,
      directCostEstimateDkk: 0,
      ferryCostDkk: 300,
      tollCostDkk: 50,
      settings: { ...settings, ferryCostPassThroughPct: 50, tollCostPassThroughPct: 100 },
    })
    expect(result.totalDirectCostDkk).toBe(200) // 150 (50% of 300) + 50
  })

  it('rejects a seat price above the computed cap', () => {
    expect(isSeatPriceWithinCap(150, 100)).toBe(false)
  })

  it('accepts a seat price at or below the computed cap', () => {
    expect(isSeatPriceWithinCap(100, 100)).toBe(true)
    expect(isSeatPriceWithinCap(80, 100)).toBe(true)
  })

  it('tolerates a tiny rounding epsilon but not a real overcharge', () => {
    expect(isSeatPriceWithinCap(100.005, 100)).toBe(true)
    expect(isSeatPriceWithinCap(101, 100)).toBe(false)
  })
})
