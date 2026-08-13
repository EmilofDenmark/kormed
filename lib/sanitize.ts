import DOMPurify from 'isomorphic-dompurify'

/**
 * Strips ALL HTML/scripts and trims to a max length. Every free-text field a
 * user submits (ride comment, ferry notes, chat message, rating comment, DSA
 * notice explanation, bio) must go through this before it is stored —
 * plain text only, no markup, no XSS surface (spec §8/§25).
 */
export function sanitizePlainText(input: string, maxLength: number): string {
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  return clean.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}
