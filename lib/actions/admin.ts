'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { sanitizePlainText } from '@/lib/sanitize'
import { email } from '@/lib/email'
import { brand } from '@/lib/config/brand'
import {
  ferryRouteSchema,
  updateSettingSchema,
  suspendUserSchema,
  hideRideSchema,
  legalDocumentSchema,
} from '@/lib/validation/admin'
import { noticeDecisionSchema } from '@/lib/validation/notice'
import type { ActionResult } from './auth'

async function logAdminAction(
  adminId: string,
  actionType: string,
  targetTable: string | null,
  targetId: string | null,
  reason?: string | null
) {
  const supabase = await createClient()
  await supabase
    .from('admin_actions')
    .insert({ admin_id: adminId, action_type: actionType, target_table: targetTable, target_id: targetId, reason: reason ?? null, metadata: null })
}

// -------------------------------------------------------------- users
export async function suspendUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = suspendUserSchema.safeParse({ userId: formData.get('userId'), reason: formData.get('reason') })
  if (!parsed.success) return { success: false, error: 'Angiv venligst en årsag.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'suspended', suspended_reason: sanitizePlainText(parsed.data.reason, 500) })
    .eq('id', parsed.data.userId)
  if (error) return { success: false, error: 'Kunne ikke spærre brugeren.' }

  // Håndhæv udelukkelsen: spær selve login (Supabase Auth ban) og fjern
  // brugerens aktive ture fra søgningen. Fejl her må ikke skjules — status er
  // allerede sat, så vi melder tilbage, hvis låsen ikke kunne sættes.
  let enforcementFailed = false
  try {
    const authAdmin = createAdminClient()
    const { error: banError } = await authAdmin.auth.admin.updateUserById(parsed.data.userId, { ban_duration: '876000h' })
    if (banError) enforcementFailed = true
    await authAdmin
      .from('rides')
      .update({ status: 'CANCELLED', cancelled_reason: 'Brugeren er udelukket fra KørMed', cancelled_at: new Date().toISOString() })
      .eq('driver_id', parsed.data.userId)
      .eq('status', 'PUBLISHED')
  } catch (err) {
    console.error('suspend_enforcement_failed', err)
    enforcementFailed = true
  }

  await logAdminAction(admin.id, 'suspend_user', 'profiles', parsed.data.userId, parsed.data.reason)
  if (enforcementFailed) {
    revalidatePath('/admin/brugere')
    return { success: false, error: 'Brugeren er markeret som spærret, men login kunne ikke låses. Prøv igen.' }
  }

  // Skriftlig begrundelse til brugeren (DSA art. 17): hvad der er sket, hvorfor, og hvordan man
  // klager. En mislykket mail ændrer ikke udelukkelsen, men logges, så den kan ses bagefter.
  try {
    const { data: target } = await supabase.from('profiles').select('email, first_name').eq('id', parsed.data.userId).single()
    if (target?.email) {
      await email.send({
        to: target.email,
        subject: `Din konto på ${brand.name} er udelukket`,
        text:
          `Hej ${target.first_name},\n\n` +
          `Din konto på ${brand.name} er blevet udelukket. Du kan ikke længere logge ind, oprette ture eller booke.\n\n` +
          `Begrundelse: ${sanitizePlainText(parsed.data.reason, 500)}\n\n` +
          `Udelukkelsen sker efter vores vilkår, som du har accepteret ved oprettelsen. ` +
          `Mener du, at afgørelsen er forkert, kan du skrive til ${brand.supportEmail}, så vurderer vi sagen igen.\n\n` +
          `Venlig hilsen\n${brand.name}`,
      })
    }
  } catch (err) {
    console.error('suspend_reason_email_failed', err)
  }
  revalidatePath('/admin/brugere')
  return { success: true }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ status: 'active', suspended_reason: null }).eq('id', userId)
  if (error) return { success: false, error: 'Kunne ikke genaktivere brugeren.' }

  try {
    const authAdmin = createAdminClient()
    await authAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
  } catch (err) {
    console.error('reactivate_unban_failed', err)
    return { success: false, error: 'Brugeren er markeret aktiv, men login kunne ikke åbnes igen. Prøv igen.' }
  }

  await logAdminAction(admin.id, 'reactivate_user', 'profiles', userId)
  revalidatePath('/admin/brugere')
  return { success: true }
}

// -------------------------------------------------------------- rides
export async function hideRideAdmin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = hideRideSchema.safeParse({ rideId: formData.get('rideId'), reason: formData.get('reason') })
  if (!parsed.success) return { success: false, error: 'Angiv venligst en årsag.' }

  const supabase = await createClient()
  const { error } = await supabase.from('rides').update({ status: 'CANCELLED', cancelled_reason: sanitizePlainText(parsed.data.reason, 500), cancelled_at: new Date().toISOString() }).eq('id', parsed.data.rideId)
  if (error) return { success: false, error: 'Kunne ikke skjule turen.' }

  await logAdminAction(admin.id, 'hide_ride', 'rides', parsed.data.rideId, parsed.data.reason)
  revalidatePath('/admin/ture')
  return { success: true }
}

// -------------------------------------------------------------- ferry routes
export async function saveFerryRoute(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = ferryRouteSchema.safeParse({
    id: formData.get('id') || undefined,
    operator: formData.get('operator'),
    departurePort: formData.get('departurePort'),
    arrivalPort: formData.get('arrivalPort'),
    defaultDepartureTime: formData.get('defaultDepartureTime') || null,
    notes: formData.get('notes') || null,
    active: formData.get('active') === 'on',
  })
  if (!parsed.success) return { success: false, error: 'Udfyld venligst alle påkrævede felter.' }

  const supabase = await createClient()
  const row = {
    operator: sanitizePlainText(parsed.data.operator, 120),
    departure_port: sanitizePlainText(parsed.data.departurePort, 120),
    arrival_port: sanitizePlainText(parsed.data.arrivalPort, 120),
    default_departure_time: parsed.data.defaultDepartureTime,
    notes: parsed.data.notes ? sanitizePlainText(parsed.data.notes, 300) : null,
    active: parsed.data.active,
  }

  const { error } = parsed.data.id
    ? await supabase.from('ferry_routes').update(row).eq('id', parsed.data.id)
    : await supabase.from('ferry_routes').insert(row)
  if (error) return { success: false, error: 'Kunne ikke gemme færgeruten.' }

  await logAdminAction(admin.id, parsed.data.id ? 'update_ferry_route' : 'create_ferry_route', 'ferry_routes', parsed.data.id ?? null)
  revalidatePath('/admin/faerger')
  return { success: true }
}

export async function toggleFerryRouteActive(ferryRouteId: string, active: boolean): Promise<ActionResult> {
  const admin = await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('ferry_routes').update({ active }).eq('id', ferryRouteId)
  if (error) return { success: false, error: 'Kunne ikke opdatere færgeruten.' }

  await logAdminAction(admin.id, active ? 'activate_ferry_route' : 'deactivate_ferry_route', 'ferry_routes', ferryRouteId)
  revalidatePath('/admin/faerger')
  return { success: true }
}

// -------------------------------------------------------------- settings
export async function updateSetting(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const rawValue = formData.get('value')
  const key = String(formData.get('key') || '')
  const type = String(formData.get('type') || 'number')

  let value: number | string | boolean | number[]
  if (type === 'boolean') value = rawValue === 'on'
  else if (type === 'number') value = Number(rawValue)
  else if (type === 'number_array') {
    value = String(rawValue ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  } else value = String(rawValue ?? '')

  const parsed = updateSettingSchema.safeParse({ key, value })
  if (!parsed.success) return { success: false, error: 'Ugyldig værdi.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('app_settings')
    .update({ value: parsed.data.value, updated_at: new Date().toISOString(), updated_by: admin.id })
    .eq('key', parsed.data.key)
  if (error) return { success: false, error: 'Kunne ikke gemme indstillingen.' }

  await logAdminAction(admin.id, 'update_setting', 'app_settings', null, `${key} = ${JSON.stringify(value)}`)
  revalidatePath('/admin/priser')
  revalidatePath('/admin/stoette')
  revalidatePath('/tilbyd-lift')
  revalidatePath('/stoet-koermed')
  revalidatePath('/', 'layout')
  return { success: true }
}

// -------------------------------------------------------------- legal documents
export async function publishLegalDocument(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = legalDocumentSchema.safeParse({ type: formData.get('type'), content: formData.get('content') })
  if (!parsed.success) return { success: false, error: 'Udfyld venligst indholdet.' }

  const supabase = await createClient()
  const { data: latest } = await supabase
    .from('legal_documents')
    .select('version')
    .eq('type', parsed.data.type)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextVersion = (latest?.version ?? 0) + 1

  const { error } = await supabase.from('legal_documents').insert({
    type: parsed.data.type,
    version: nextVersion,
    content: parsed.data.content,
    requires_legal_review: true,
    published_at: new Date().toISOString(),
  })
  if (error) return { success: false, error: 'Kunne ikke udgive dokumentet.' }

  await logAdminAction(admin.id, 'publish_legal_document', 'legal_documents', null, `${parsed.data.type} v${nextVersion}`)
  revalidatePath('/admin/juridisk')
  revalidatePath(parsed.data.type === 'terms' ? '/vilkaar' : '/privatliv')
  return { success: true }
}

// -------------------------------------------------------------- DSA notices
export async function updateNoticeStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = noticeDecisionSchema.safeParse({
    noticeId: formData.get('noticeId'),
    status: formData.get('status'),
    decisionReason: formData.get('decisionReason') || null,
  })
  if (!parsed.success) return { success: false, error: 'Ugyldig anmeldelse.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('content_notices')
    .update({
      status: parsed.data.status,
      decision_reason: parsed.data.decisionReason ? sanitizePlainText(parsed.data.decisionReason, 2000) : null,
      handled_by: admin.id,
    })
    .eq('id', parsed.data.noticeId)
  if (error) return { success: false, error: 'Kunne ikke opdatere anmeldelsen.' }

  await logAdminAction(admin.id, 'update_notice', 'content_notices', parsed.data.noticeId, parsed.data.status)
  revalidatePath('/admin/anmeldelser')
  return { success: true }
}

/**
 * Narrow, audited exception to "no general chat browser" (spec §16/§21):
 * retrieves the messages of a conversation ONLY when a DSA notice points at
 * one of its messages. The admin_get_notice_messages RPC itself checks the
 * caller is an admin and logs an admin_actions row for every call.
 */
export async function viewNoticeMessages(noticeId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_notice_messages', { p_notice_id: noticeId })
  if (error) return { messages: [], error: 'Kunne ikke hente beskederne.' }
  return { messages: data ?? [], error: null }
}

/** Hides the reported content itself (ride, or rating comment) as part of acting on a notice. */
export async function hideReportedContent(contentType: string, contentId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  const supabase = await createClient()

  if (contentType === 'ride') {
    await supabase.from('rides').update({ status: 'CANCELLED', cancelled_reason: 'Skjult efter DSA-anmeldelse' }).eq('id', contentId)
  } else if (contentType === 'rating_comment') {
    await supabase.from('ratings').update({ comment_hidden: true }).eq('id', contentId)
  } else {
    return { success: false, error: 'Denne indholdstype kan ikke skjules automatisk.' }
  }

  await logAdminAction(admin.id, 'hide_reported_content', contentType, contentId)
  revalidatePath('/admin/anmeldelser')
  return { success: true }
}
