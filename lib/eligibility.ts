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

export function isVerified(profile: VerificationStatus): boolean {
  return profile.email_verified && profile.phone_verified
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
