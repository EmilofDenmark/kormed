/**
 * Central branding config. This is the ONLY place service naming should be
 * hardcoded — every page/component/email must read from here (or from the
 * NEXT_PUBLIC_APP_NAME env var this wraps) so the product can be renamed
 * later without touching application code. Currently "KørMed" (previously
 * "MedPå" during early development).
 */

export const brand = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'KørMed',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Skal du samme vej? KørMed.',
  supportingText: 'Find et lift hos en, der allerede skal afsted – eller tilbyd en ledig plads i din bil.',
  socialHandle: process.env.NEXT_PUBLIC_SOCIAL_HANDLE || '@KørMed',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'emil@viniglasset.dk',
  companyName: 'Dosage',
  locale: 'da-DK',
  currency: 'DKK',
} as const

/**
 * Colour tokens, mirrored in tailwind.config.ts and app/globals.css.
 * Kept here too so non-Tailwind code (emails, map markers) can reference
 * the same palette without duplicating hex values.
 */
export const colors = {
  background: '#F7F8F6',
  surface: '#FFFFFF',
  brandDark: '#17324D',
  brandGreen: '#2F7D6D',
  brandNeutral: '#EDE9E0',
} as const

export type Brand = typeof brand
