import { describe, it, expect } from 'vitest'
import { isVerified, REQUIRE_PHONE_VERIFICATION, canPublishRide, canRequestBooking, hasAdminAccess } from '@/lib/eligibility'

// Spec §36 rule 2: only verified users can create rides.
describe('publishing eligibility', () => {
  const verified = { email_verified: true, phone_verified: true }
  const unverified = { email_verified: false, phone_verified: false }

  it('requires a verified email (phone verification is optional while SMS is switched off)', () => {
    expect(REQUIRE_PHONE_VERIFICATION).toBe(false)
    expect(isVerified(verified)).toBe(true)
    expect(isVerified({ email_verified: true, phone_verified: false })).toBe(true)
    expect(isVerified(unverified)).toBe(false)
    expect(isVerified({ email_verified: false, phone_verified: true })).toBe(false)
  })

  it('blocks ride publishing without a verified account, even with the declaration accepted', () => {
    expect(canPublishRide(unverified, true)).toBe(false)
  })

  it('blocks ride publishing without the driver declaration, even when verified', () => {
    expect(canPublishRide(verified, false)).toBe(false)
  })

  it('allows ride publishing when both conditions hold', () => {
    expect(canPublishRide(verified, true)).toBe(true)
  })

  it('blocks booking requests from unverified users', () => {
    expect(canRequestBooking(unverified, false)).toBe(false)
  })

  it('blocks a driver from booking their own ride even if verified', () => {
    expect(canRequestBooking(verified, true)).toBe(false)
  })

  it('allows a verified user to request a seat on someone else\'s ride', () => {
    expect(canRequestBooking(verified, false)).toBe(true)
  })
})

// Spec §36 rule 10: admin access is protected.
describe('admin access', () => {
  it('only grants access to the admin role', () => {
    expect(hasAdminAccess('admin')).toBe(true)
    expect(hasAdminAccess('user')).toBe(false)
    expect(hasAdminAccess('')).toBe(false)
  })
})
