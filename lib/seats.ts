/**
 * Pure mirror of the seat arithmetic in the accept_booking /
 * cancel_booking_by_passenger RPCs (supabase/migrations/20260101000008_booking_rpcs.sql).
 * The RPCs are the authoritative, row-locked enforcement against concurrent
 * overbooking — this module lets that same arithmetic be unit tested
 * without a live Postgres instance.
 */

export function canAcceptBooking(availableSeats: number, requestedSeats: number): boolean {
  return requestedSeats > 0 && requestedSeats <= availableSeats
}

export function seatsAfterAccept(availableSeats: number, requestedSeats: number): number {
  if (!canAcceptBooking(availableSeats, requestedSeats)) {
    throw new RangeError('not_enough_seats')
  }
  return availableSeats - requestedSeats
}

export function seatsAfterCancel(availableSeats: number, originalSeats: number, cancelledSeats: number): number {
  return Math.min(originalSeats, availableSeats + cancelledSeats)
}
