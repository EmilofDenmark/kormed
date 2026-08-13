'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppSettings } from '@/lib/settings'
import { selectSupportProvider } from '@/lib/support'
import { startContributionSchema } from '@/lib/validation/support'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import type { ActionResult } from './auth'

/**
 * Voluntary support contribution (spec update §3). Completely separate from
 * ride bookings — never touches the rides/bookings tables, never affects
 * search ranking or ratings, and is never required to use KørMed. Anonymous
 * contributions are allowed (user_id is left null when not logged in).
 */
export async function startSupportContribution(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const choice = String(formData.get('amountChoice') || '')
  const customAmount = formData.get('customAmount')
  const amountRaw = choice === 'custom' ? customAmount : choice

  const parsed = startContributionSchema.safeParse({ amountDkk: Number(amountRaw) })
  if (!parsed.success) {
    return { success: false, error: 'Vælg venligst et beløb, eller indtast dit eget.' }
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`support:${ip}`, 10, 3600)
  if (!allowed) {
    return { success: false, error: 'For mange forsøg. Prøv igen senere.' }
  }

  const settings = await getAppSettings()
  if (!settings.support.enabled) {
    return { success: false, error: 'Det er desværre ikke muligt at støtte lige nu.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: contribution, error } = await supabase
    .from('support_contributions')
    .insert({
      user_id: user?.id ?? null,
      amount: parsed.data.amountDkk,
      payment_provider: settings.support.paymentProvider,
    })
    .select('id')
    .single()

  if (error || !contribution) {
    return { success: false, error: 'Kunne ikke starte dit bidrag. Prøv igen.' }
  }

  const provider = selectSupportProvider(settings.support.paymentProvider)
  const result = provider.startContribution({ amountDkk: parsed.data.amountDkk, contributionId: contribution.id })

  if (!result.redirectUrl) {
    return {
      success: false,
      error:
        'Tak for din interesse! Betalingsudbyderen er endnu ikke sat op — skriv endelig til os, hvis du gerne vil støtte KørMed nu.',
    }
  }

  redirect(result.redirectUrl)
}
