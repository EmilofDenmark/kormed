/**
 * ============================================================================
 * REQUIRES DANISH LEGAL REVIEW BEFORE PRODUCTION LAUNCH
 * ============================================================================
 * This module is the ENTIRE legal safeguard behind spec §9: it turns a
 * driver's trip costs into a maximum per-passenger contribution, and nothing
 * elsewhere in the codebase is allowed to compute or override that number.
 * The specific formula below (divide total direct cost by everyone in the
 * car, i.e. driver + passengers) reflects a common, conservative
 * cost-sharing convention — it is NOT a verified statement of what Danish
 * law currently permits for informal ridesharing. A qualified Danish lawyer
 * must review this formula, the default rates in the
 * `price_per_km_dkk` / `*_pass_through_pct` app_settings (seeded in
 * supabase/migrations/20260101000012_seed_settings.sql), and the copy in
 * app/(marketing)/samkoersel before this goes live with real users.
 *
 * Do not hardcode a DKK/km rate anywhere else in the app — always read it
 * from app_settings via lib/settings.ts so the admin panel stays the single
 * source of truth (spec §9/§22).
 * ============================================================================
 */

export interface PricingSettings {
  pricePerKmDkk: number
  ferryCostPassThroughPct: number
  tollCostPassThroughPct: number
  roundingMethod: 'nearest_1' | 'nearest_5' | 'nearest_10'
}

export interface ComputeMaxContributionInput {
  distanceKm: number
  /** Passenger seats offered — the driver is not counted here but IS counted in the split (see totalPeopleInCar). */
  seatsOffered: number
  /** Driver's own estimate of total direct trip cost (fuel/electricity). Falls back to distanceKm * pricePerKmDkk when absent. */
  directCostEstimateDkk?: number | null
  ferryCostDkk?: number | null
  tollCostDkk?: number | null
  settings: PricingSettings
}

export interface MaxContributionResult {
  totalDirectCostDkk: number
  totalPeopleInCar: number
  maxContributionPerPassengerDkk: number
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function applyRounding(value: number, method: PricingSettings['roundingMethod']): number {
  switch (method) {
    case 'nearest_1':
      return Math.round(value)
    case 'nearest_10':
      return Math.round(value / 10) * 10
    case 'nearest_5':
    default:
      return Math.round(value / 5) * 5
  }
}

export function computeMaxContribution(input: ComputeMaxContributionInput): MaxContributionResult {
  if (input.distanceKm < 0 || input.seatsOffered < 1) {
    throw new RangeError('invalid_pricing_input')
  }

  const baseCost =
    input.directCostEstimateDkk != null && input.directCostEstimateDkk > 0
      ? input.directCostEstimateDkk
      : round2(input.distanceKm * input.settings.pricePerKmDkk)

  const ferryPortion = round2((input.ferryCostDkk ?? 0) * (input.settings.ferryCostPassThroughPct / 100))
  const tollPortion = round2((input.tollCostDkk ?? 0) * (input.settings.tollCostPassThroughPct / 100))

  const totalDirectCostDkk = round2(baseCost + ferryPortion + tollPortion)
  const totalPeopleInCar = input.seatsOffered + 1
  const rawPerPassenger = totalDirectCostDkk / totalPeopleInCar
  const maxContributionPerPassengerDkk = Math.max(0, applyRounding(rawPerPassenger, input.settings.roundingMethod))

  return { totalDirectCostDkk, totalPeopleInCar, maxContributionPerPassengerDkk }
}

/** Small epsilon tolerance so rounding differences don't reject a price that matches the displayed cap. */
const PRICE_EPSILON_DKK = 0.01

export function isSeatPriceWithinCap(seatPriceDkk: number, maxContributionPerPassengerDkk: number): boolean {
  return seatPriceDkk <= maxContributionPerPassengerDkk + PRICE_EPSILON_DKK
}
