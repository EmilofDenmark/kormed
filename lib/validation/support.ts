import { z } from 'zod'

export const startContributionSchema = z.object({
  amountDkk: z.number().positive().max(100000),
})
