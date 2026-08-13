/**
 * Hardcoded fallback defaults for the three feature flags spec §22 requires
 * to default to FALSE. The real, admin-editable values live in app_settings
 * (supabase/migrations/20260101000012_seed_settings.sql / /admin/priser) —
 * this module exists so the "must default to false" guarantee is testable
 * as plain code, independent of any database round trip. lib/settings.ts
 * uses these exact values as its fallback when a settings row is missing.
 */
export const DEFAULT_FEATURE_FLAGS = {
  paymentsEnabled: false,
  recurringRidesEnabled: false,
  analyticsEnabled: false,
} as const
