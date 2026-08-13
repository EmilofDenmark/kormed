'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizePlainText } from '@/lib/sanitize'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { contentNoticeSchema } from '@/lib/validation/notice'
import type { ActionResult } from './auth'

export async function submitContentNotice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contentNoticeSchema.safeParse({
    contentType: formData.get('contentType'),
    contentId: formData.get('contentId'),
    url: formData.get('url') || null,
    reporterEmail: formData.get('reporterEmail'),
    explanation: formData.get('explanation'),
    legalCategory: formData.get('legalCategory') || null,
    goodFaithConfirmed: formData.get('goodFaithConfirmed') === 'on',
  })
  if (!parsed.success) {
    return { success: false, error: 'Udfyld venligst alle påkrævede felter korrekt.' }
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`content-notice:${ip}`, 5, 3600)
  if (!allowed) {
    return { success: false, error: 'For mange anmeldelser. Prøv igen senere, eller skriv til os direkte.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('content_notices').insert({
    content_type: parsed.data.contentType,
    content_id: parsed.data.contentId,
    url: parsed.data.url ? sanitizePlainText(parsed.data.url, 500) : null,
    reporter_user_id: user?.id ?? null,
    reporter_email: parsed.data.reporterEmail,
    explanation: sanitizePlainText(parsed.data.explanation, 2000),
    legal_category: parsed.data.legalCategory ? sanitizePlainText(parsed.data.legalCategory, 200) : null,
    good_faith_confirmed: parsed.data.goodFaithConfirmed,
  })

  if (error) {
    return { success: false, error: 'Kunne ikke indsende anmeldelsen. Prøv igen.' }
  }

  return { success: true }
}
