import { describe, it, expect } from 'vitest'
import { DEFAULT_FEATURE_FLAGS } from '@/lib/config/featureFlags'
import { requestBookingSchema } from '@/lib/validation/booking'
import { rideFieldsSchema } from '@/lib/validation/ride'

// Spec §36 rule 11: payment processing is disabled.
describe('payments are disabled by default', () => {
  it('defaults payments_enabled to false', () => {
    expect(DEFAULT_FEATURE_FLAGS.paymentsEnabled).toBe(false)
  })

  it('the booking request form has no payment-related field for a client to submit', () => {
    const keys = Object.keys(requestBookingSchema.shape)
    expect(keys.some((k) => /pay|card|amount|charge/i.test(k))).toBe(false)
  })
})

// Spec §36 rule 12: recurring rides cannot be created.
describe('recurring rides are impossible', () => {
  it('defaults recurring_rides_enabled to false', () => {
    expect(DEFAULT_FEATURE_FLAGS.recurringRidesEnabled).toBe(false)
  })

  it('the ride creation schema has no recurrence field to submit', () => {
    const keys = Object.keys(rideFieldsSchema.shape)
    expect(keys.some((k) => /recur|repeat|weekly|schedule/i.test(k))).toBe(false)
    // Every ride is a single date + time — that pair is required, not a list/pattern.
    expect(rideFieldsSchema.shape.departureDate).toBeDefined()
    expect(rideFieldsSchema.shape.departureTime).toBeDefined()
  })
})
