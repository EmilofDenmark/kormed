'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signupSchema, loginSchema, phoneOtpRequestSchema, phoneOtpVerifySchema } from '@/lib/validation/auth'
import { sanitizePlainText } from '@/lib/sanitize'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { brand } from '@/lib/config/brand'

export interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

function fieldErrorsFrom(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors
  const out: Record<string, string> = {}
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) out[key] = messages[0]
  }
  return out
}

// Never surface raw Supabase/Postgres error text to users (spec §37) — map
// the handful of cases we deliberately raise (see handle_new_user trigger,
// booking RPCs) to plain Danish, and give everything else one generic message.
function toUserMessage(message: string): string {
  if (message.includes('signup_underage')) return 'Du skal være mindst 18 år for at oprette en konto.'
  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'Der findes allerede en konto med denne e-mailadresse.'
  }
  if (message.includes('Invalid login credentials')) return 'Forkert e-mail eller adgangskode.'
  if (message.toLowerCase().includes('banned')) {
    return `Din konto er udelukket fra ${brand.name}. Hvis du mener, det er en fejl, kan du skrive til ${brand.supportEmail}.`
  }
  if (message.includes('Email not confirmed')) return 'Bekræft venligst din e-mailadresse først — tjek din indbakke.'
  if (message.includes('Phone') && message.includes('invalid')) return 'Ugyldigt telefonnummer.'
  if (message.includes('token') && message.includes('invalid')) return 'Koden er forkert eller udløbet.'
  return 'Der opstod en fejl. Prøv venligst igen.'
}

async function currentTermsAndPrivacyVersions() {
  const supabase = await createClient()
  const [{ data: terms }, { data: privacy }] = await Promise.all([
    supabase
      .from('legal_documents')
      .select('version')
      .eq('type', 'terms')
      .not('published_at', 'is', null)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('legal_documents')
      .select('version')
      .eq('type', 'privacy')
      .not('published_at', 'is', null)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  return { termsVersion: terms?.version ?? 1, privacyVersion: privacy?.version ?? 1 }
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData) as Record<string, string>
  const parsed = signupSchema.safeParse({
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    phone: raw.phone,
    password: raw.password,
    dateOfBirth: raw.dateOfBirth,
    acceptedTerms: raw.acceptedTerms === 'on',
    acceptedPrivacy: raw.acceptedPrivacy === 'on',
  })

  if (!parsed.success) {
    return { success: false, error: 'Udfyld venligst alle felter korrekt.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`signup:${ip}`, 5, 3600)
  if (!allowed) {
    return { success: false, error: 'For mange forsøg på at oprette en konto. Prøv igen om lidt.' }
  }

  const { firstName, lastName, email, phone, password, dateOfBirth } = parsed.data
  const { termsVersion, privacyVersion } = await currentTermsAndPrivacyVersions()

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: sanitizePlainText(firstName, 60),
        last_name: sanitizePlainText(lastName, 60),
        phone,
        date_of_birth: dateOfBirth,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
      },
      emailRedirectTo: `${brand.url}/auth/callback`,
    },
  })

  if (error) {
    console.error('signup_failed', error.message)
    return { success: false, error: toUserMessage(error.message) }
  }

  redirect('/tilmeld/bekraeft')
}

export async function logIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: 'Udfyld venligst e-mail og adgangskode.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`login:${ip}`, 10, 600)
  if (!allowed) {
    return { success: false, error: 'For mange loginforsøg. Prøv igen om lidt.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    console.error('auth_action_failed', error.message)
    return { success: false, error: toUserMessage(error.message) }
  }

  const next = String(formData.get('next') || '')
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/mine-ture')
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function requestPhoneOtp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = phoneOtpRequestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: 'Ugyldigt telefonnummer.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const allowed = await checkRateLimit(`phone-otp:${user.id}`, 5, 900)
  if (!allowed) return { success: false, error: 'For mange forsøg. Prøv igen om lidt.' }

  const { error } = await supabase.auth.updateUser({ phone: parsed.data.phone })
  if (error) {
    console.error('auth_action_failed', error.message)
    return { success: false, error: toUserMessage(error.message) }
  }
  return { success: true }
}

export async function verifyPhoneOtp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = phoneOtpVerifySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: 'Indtast venligst den 6-cifrede kode.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: 'phone_change',
  })
  if (error) {
    console.error('auth_action_failed', error.message)
    return { success: false, error: toUserMessage(error.message) }
  }

  redirect('/profil')
}

export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim()
  if (!email) return { success: false, error: 'Indtast venligst din e-mailadresse.' }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`pwreset:${ip}`, 5, 3600)
  if (!allowed) return { success: false, error: 'For mange forsøg. Prøv igen senere.' }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${brand.url}/auth/callback?next=/nyt-kodeord` })

  // Always return success, whether or not the email exists — avoids leaking
  // which addresses have an account.
  return { success: true }
}

export async function setNewPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') || '')
  if (password.length < 8) {
    return { success: false, error: 'Adgangskoden skal være mindst 8 tegn.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error('auth_action_failed', error.message)
    return { success: false, error: toUserMessage(error.message) }
  }

  redirect('/profil')
}
