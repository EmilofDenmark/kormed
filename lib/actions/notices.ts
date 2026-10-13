'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizePlainText } from '@/lib/sanitize'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { contentNoticeSchema } from '@/lib/validation/notice'
import { email } from '@/lib/email'
import { brand } from '@/lib/config/brand'
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

  // Giv administratoren besked på e-mail, så ingen skal tjekke adminsiden
  // selv. En mislykket mail må aldrig få selve anmeldelsen til at fejle — den
  // er gemt, og ligger under /admin/anmeldelser.
  try {
    await email.send({
      to: brand.supportEmail,
      subject: `Ny anmeldelse af ulovligt indhold på ${brand.name}`,
      text:
        `Der er indsendt en ny anmeldelse (${parsed.data.contentType}).\n\n` +
        `Begrundelse: ${sanitizePlainText(parsed.data.explanation, 500)}\n\n` +
        `Behandl den her: ${brand.url}/admin/anmeldelser\n\n` +
        `Du kan udelukke brugeren under ${brand.url}/admin/brugere.`,
    })
  } catch (err) {
    console.error('notice_admin_email_failed', err)
  }

  return { success: true }
}
