/**
 * Pure mirror of the ratings_insert_own RLS policy (spec §19/§25: "Users may
 * only rate users with whom they had an ACCEPTED [completed] booking").
 */
export function canRate(
  booking: { status: string; passenger_id: string },
  ride: { driver_id: string },
  raterId: string,
  rateeId: string
): boolean {
  if (booking.status !== 'COMPLETED') return false

  const passengerRatingDriver = raterId === booking.passenger_id && rateeId === ride.driver_id
  const driverRatingPassenger = raterId === ride.driver_id && rateeId === booking.passenger_id

  return passengerRatingDriver || driverRatingPassenger
}
