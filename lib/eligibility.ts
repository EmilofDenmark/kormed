/**
 * Pure eligibility predicates mirroring the authoritative server-side checks
 * (createRide/request_booking server actions & RPCs, requireAdmin in
 * lib/session.ts). Kept dependency-free so the business rules in spec §36
 * are unit-testable without a live Supabase instance — the actual
 * enforcement still happens server-side/in Postgres; these are the same
 * rules expressed as plain functions.
 */

export interface VerificationStatus {
  email_verified: boolean
  phone_verified: boolean
}

/**
 * Telefonbekræftelse (SMS) er slået fra indtil videre, fordi der ikke er
 * tilsluttet en SMS-udbyder. Sæt til `true` igen, når SMS er sat op i
 * Supabase (Authentication → Providers → Phone) — og husk også at køre
 * migrationen, der kræver telefon i `request_booking` (se
 * supabase/migrations/20260101000015_phone_verification_optional.sql).
 */
export const REQUIRE_PHONE_VERIFICATION = false

export function isVerified(profile: VerificationStatus): boolean {
  return profile.email_verified && (!REQUIRE_PHONE_VERIFICATION || profile.phone_verified)
}

export function canPublishRide(profile: VerificationStatus, hasAcceptedDriverDeclaration: boolean): boolean {
  return isVerified(profile) && hasAcceptedDriverDeclaration
}

export function canRequestBooking(profile: VerificationStatus, isOwnRide: boolean): boolean {
  return isVerified(profile) && !isOwnRide
}

export function hasAdminAccess(role: string): boolean {
  return role === 'admin'
}
