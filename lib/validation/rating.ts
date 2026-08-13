import { z } from 'zod'

export const submitRatingSchema = z.object({
  bookingId: z.string().uuid(),
  rateeId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().nullable(),
})
