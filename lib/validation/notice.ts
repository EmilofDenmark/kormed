import { z } from 'zod'

export const contentNoticeSchema = z.object({
  contentType: z.enum(['ride', 'profile', 'rating_comment', 'message']),
  contentId: z.string().uuid(),
  url: z.string().trim().max(500).optional().nullable(),
  reporterEmail: z.string().trim().email('Ugyldig e-mailadresse'),
  explanation: z.string().trim().min(10, 'Beskriv venligst hvorfor indholdet kan være ulovligt').max(2000),
  legalCategory: z.string().trim().max(200).optional().nullable(),
  goodFaithConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Du skal bekræfte, at anmeldelsen er indgivet i god tro' }),
  }),
})

export type ContentNoticeInput = z.infer<typeof contentNoticeSchema>

export const noticeDecisionSchema = z.object({
  noticeId: z.string().uuid(),
  status: z.enum(['UNDER_REVIEW', 'ACTION_TAKEN', 'NO_ACTION', 'CLOSED']),
  decisionReason: z.string().trim().max(2000).optional().nullable(),
})
