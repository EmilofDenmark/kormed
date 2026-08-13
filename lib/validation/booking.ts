import { z } from 'zod'

export const requestBookingSchema = z.object({
  rideId: z.string().uuid(),
  seats: z.number().int().min(1).max(7),
  message: z.string().trim().max(500).optional().nullable(),
})

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().max(300).optional().nullable(),
})

export const cancelRideSchema = z.object({
  rideId: z.string().uuid(),
  reason: z.string().trim().max(300).optional().nullable(),
})

export const respondBookingSchema = z.object({
  bookingId: z.string().uuid(),
})
