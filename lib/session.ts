import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Database } from './supabase/types'
import { isVerified as isVerifiedPredicate, hasAdminAccess } from './eligibility'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Full own-profile row (RLS only allows this for the owner or an admin). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return profile
}

export async function requireProfile(redirectTo = '/log-ind'): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect(redirectTo)
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile()
  if (!hasAdminAccess(profile.role)) redirect('/')
  return profile
}

export function isVerified(profile: Pick<Profile, 'email_verified' | 'phone_verified'>): boolean {
  return isVerifiedPredicate(profile)
}
