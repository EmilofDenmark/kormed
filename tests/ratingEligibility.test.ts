import { describe, it, expect } from 'vitest'
import { canRate } from '@/lib/ratingEligibility'

// Spec §36 rule 7: users cannot rate users without a completed booking together.
describe('rating eligibility', () => {
  const ride = { driver_id: 'driver-1' }
  const completedBooking = { status: 'COMPLETED', passenger_id: 'passenger-1' }
  const pendingBooking = { status: 'PENDING', passenger_id: 'passenger-1' }

  it('lets the passenger rate the driver after completion', () => {
    expect(canRate(completedBooking, ride, 'passenger-1', 'driver-1')).toBe(true)
  })

  it('lets the driver rate the passenger after completion', () => {
    expect(canRate(completedBooking, ride, 'driver-1', 'passenger-1')).toBe(true)
  })

  it('blocks rating before the booking is completed', () => {
    expect(canRate(pendingBooking, ride, 'passenger-1', 'driver-1')).toBe(false)
  })

  it('blocks a passenger from rating an unrelated user', () => {
    expect(canRate(completedBooking, ride, 'passenger-1', 'some-other-user')).toBe(false)
  })

  it('blocks a completely unrelated user from rating either party', () => {
    expect(canRate(completedBooking, ride, 'random-user', 'driver-1')).toBe(false)
  })
})
