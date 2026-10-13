import 'server-only'
import { cache } from 'react'
import { createClient } from './supabase/server'
import type { PricingSettings } from './pricing/costSharing'
import { DEFAULT_FEATURE_FLAGS } from './config/featureFlags'

export interface SupportSettings {
  enabled: boolean
  paymentProvider: string
  suggestedAmounts: number[]
  customAmountEnabled: boolean
}

export interface WinePromotionSettings {
  enabled: boolean
  shopName: string
  shopUrl: string
  promotionText: string
}

export interface AppSettings {
  searchRadiusKm: number
  autoCompleteGraceHours: number
  paymentsEnabled: boolean
  recurringRidesEnabled: boolean
  analyticsEnabled: boolean
  pricing: PricingSettings
  routePointSampleIntervalKm: number
  dataRetentionMessagesDays: number
  dataRetentionCancelledRidesDays: number
  accountDeletionGraceDays: number
  support: SupportSettings
  wine: WinePromotionSettings
}

/**
 * Fallback values used only if a row is somehow missing from app_settings
 * (e.g. a fresh database before migrations finished seeding). The real,
 * admin-editable values always come from the database — see
 * supabase/migrations/20260101000012_seed_settings.sql and /admin/priser.
 */
const FALLBACKS: AppSettings = {
  searchRadiusKm: 12,
  autoCompleteGraceHours: 24,
  ...DEFAULT_FEATURE_FLAGS,
  pricing: {
    pricePerKmDkk: 2.0,
    ferryCostPassThroughPct: 100,
    tollCostPassThroughPct: 100,
    roundingMethod: 'nearest_5',
  },
  routePointSampleIntervalKm: 10,
  dataRetentionMessagesDays: 730,
  dataRetentionCancelledRidesDays: 365,
  accountDeletionGraceDays: 30,
  support: {
    enabled: true,
    paymentProvider: 'manual',
    suggestedAmounts: [25, 50, 100],
    customAmountEnabled: true,
  },
  wine: {
    enabled: true,
    shopName: 'Vin i Glasset',
    shopUrl: 'https://viniglasset.dk',
    promotionText:
      'KørMed drives af Dosage, som også ejer Vin i Glasset. Hvis du alligevel er på udkig efter vin, kan du støtte projektet ved at handle hos Vin i Glasset.',
  },
}

/**
 * Reads every row from app_settings and maps it onto a typed object.
 * Cached per-request with React's cache() so multiple server components on
 * the same page don't each issue their own round trip.
 */
export const getAppSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient()
  const { data } = await supabase.from('app_settings').select('key, value')
  const raw = new Map<string, unknown>(data?.map((row) => [row.key, row.value]) ?? [])

  const num = (key: string, fallback: number): number => {
    const v = raw.get(key)
    return typeof v === 'number' ? v : fallback
  }
  const bool = (key: string, fallback: boolean): boolean => {
    const v = raw.get(key)
    return typeof v === 'boolean' ? v : fallback
  }
  const str = (key: string, fallback: string): string => {
    const v = raw.get(key)
    return typeof v === 'string' ? v : fallback
  }
  const numArray = (key: string, fallback: number[]): number[] => {
    const v = raw.get(key)
    return Array.isArray(v) && v.every((n) => typeof n === 'number') ? v : fallback
  }

  return {
    searchRadiusKm: num('search_radius_km', FALLBACKS.searchRadiusKm),
    autoCompleteGraceHours: num('auto_complete_grace_hours', FALLBACKS.autoCompleteGraceHours),
    paymentsEnabled: bool('payments_enabled', FALLBACKS.paymentsEnabled),
    recurringRidesEnabled: bool('recurring_rides_enabled', FALLBACKS.recurringRidesEnabled),
    analyticsEnabled: bool('analytics_enabled', FALLBACKS.analyticsEnabled),
    pricing: {
      pricePerKmDkk: num('price_per_km_dkk', FALLBACKS.pricing.pricePerKmDkk),
      ferryCostPassThroughPct: num('ferry_cost_pass_through_pct', FALLBACKS.pricing.ferryCostPassThroughPct),
      tollCostPassThroughPct: num('toll_cost_pass_through_pct', FALLBACKS.pricing.tollCostPassThroughPct),
      roundingMethod: str('price_rounding_method', FALLBACKS.pricing.roundingMethod) as PricingSettings['roundingMethod'],
    },
    routePointSampleIntervalKm: num('route_point_sample_interval_km', FALLBACKS.routePointSampleIntervalKm),
    dataRetentionMessagesDays: num('data_retention_messages_days', FALLBACKS.dataRetentionMessagesDays),
    dataRetentionCancelledRidesDays: num(
      'data_retention_cancelled_rides_days',
      FALLBACKS.dataRetentionCancelledRidesDays
    ),
    accountDeletionGraceDays: num('account_deletion_grace_days', FALLBACKS.accountDeletionGraceDays),
    support: {
      enabled: bool('support_enabled', FALLBACKS.support.enabled),
      paymentProvider: str('support_payment_provider', FALLBACKS.support.paymentProvider),
      suggestedAmounts: numArray('support_suggested_amounts', FALLBACKS.support.suggestedAmounts),
      customAmountEnabled: bool('support_custom_amount_enabled', FALLBACKS.support.customAmountEnabled),
    },
    wine: {
      enabled: bool('wine_promotion_enabled', FALLBACKS.wine.enabled),
      shopName: str('wine_shop_name', FALLBACKS.wine.shopName),
      shopUrl: str('wine_shop_url', FALLBACKS.wine.shopUrl),
      promotionText: str('wine_promotion_text', FALLBACKS.wine.promotionText),
    },
  }
})
