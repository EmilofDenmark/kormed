import { describe, it, expect } from 'vitest'
import { canAcceptBooking, seatsAfterAccept, seatsAfterCancel } from '@/lib/seats'

// Spec §36 rule 5: unavailable seats cannot be overbooked.
describe('seat availability', () => {
  it('allows accepting a request that fits within available seats', () => {
    expect(canAcceptBooking(3, 2)).toBe(true)
    expect(canAcceptBooking(2, 2)).toBe(true)
  })

  it('rejects accepting a request larger than the remaining seats', () => {
    expect(canAcceptBooking(1, 2)).toBe(false)
    expect(canAcceptBooking(0, 1)).toBe(false)
  })

  it('rejects a non-positive seat request', () => {
    expect(canAcceptBooking(3, 0)).toBe(false)
    expect(canAcceptBooking(3, -1)).toBe(false)
  })

  it('decrements available seats correctly on accept', () => {
    expect(seatsAfterAccept(3, 2)).toBe(1)
  })

  it('throws rather than silently overbooking', () => {
    expect(() => seatsAfterAccept(1, 2)).toThrow(RangeError)
  })
})

// Spec §36 rule 8: cancelled seats return to inventory.
describe('seat cancellation', () => {
  it('returns cancelled seats to the available pool', () => {
    expect(seatsAfterCancel(1, 3, 2)).toBe(3)
  })

  it('never returns more seats than the ride originally offered', () => {
    // Defends against double-cancellation or bad input inflating supply past capacity.
    expect(seatsAfterCancel(3, 3, 2)).toBe(3)
  })
})
