'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { profileUpdateSchema } from '@/lib/validation/auth'
import { sanitizePlainText } from '@/lib/sanitize'
import type { ActionResult } from './auth'

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse({
    firstName: formData.get('firstName'),
    bio: formData.get('bio') || null,
  })
  if (!parsed.success) {
    return { success: false, error: 'Udfyld venligst felterne korrekt.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: sanitizePlainText(parsed.data.firstName, 60),
      bio: parsed.data.bio ? sanitizePlainText(parsed.data.bio, 300) : null,
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Kunne ikke gemme din profil. Prøv igen.' }
  }

  revalidatePath('/profil')
  return { success: true }
}

/**
 * GDPR "Slet min konto" (spec §23). Anonymises personally identifying
 * fields immediately and locks the account out — deliberately does NOT hard
 * delete the profiles row, because rides/bookings/ratings/messages
 * reference it and other users legitimately need that history to remain
 * (e.g. a passenger's ride history, a driver's rating record). Deletion is
 * immediate in this MVP; account_deletion_grace_days in app_settings is
 * reserved for a future undo window, not yet wired up — see README
 * "Kontosletning".
 */
export async function deleteMyAccount(): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const anonymizedEmail = `deleted-${user.id}@deleted.invalid`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: 'Slettet',
      last_name: 'bruger',
      bio: null,
      avatar_url: null,
      phone: null,
      email: anonymizedEmail,
      status: 'deleted',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: 'Kunne ikke slette kontoen. Prøv igen eller kontakt support.' }
  }

  try {
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(user.id, {
      email: anonymizedEmail,
      phone: '',
      ban_duration: '87600h',
    })
  } catch (err) {
    console.error('account_deletion_ban_failed', err)
  }

  await supabase.auth.signOut()
  redirect('/')
}
