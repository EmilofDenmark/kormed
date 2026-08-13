/**
 * Driver requirement declaration (spec §7) — a fixed checklist, not an
 * editable document, so it lives in code rather than the legal_documents
 * table. Bump DRIVER_DECLARATION_VERSION whenever the wording changes; any
 * driver whose accepted version is behind this will be asked to re-confirm
 * before publishing a new ride (see lib/actions/rides.ts).
 */
export const DRIVER_DECLARATION_VERSION = 1

export const DRIVER_DECLARATION_ITEMS = [
  'Jeg er mindst 18 år.',
  'Jeg har et gyldigt kørekort.',
  'Køretøjet må lovligt køre på vejen.',
  'Køretøjet har den lovpligtige forsikring.',
  'Jeg skulle allerede foretage denne tur.',
  'Turen oprettes ikke med henblik på at tjene penge.',
  'Det ønskede bidrag dækker kun en andel af de omkostninger, der er direkte forbundet med turen.',
] as const
