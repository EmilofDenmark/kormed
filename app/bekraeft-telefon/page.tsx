import { redirect } from 'next/navigation'

/**
 * Telefonbekræftelse (SMS) er slået fra, indtil der er tilsluttet en
 * SMS-udbyder. Siden og formularen (components/auth/PhoneOtpForm.tsx) ligger
 * klar til, at vi slår den til igen — se lib/eligibility.ts.
 */
export default function ConfirmPhonePage() {
  redirect('/profil')
}
