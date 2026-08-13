/**
 * Strips ALL HTML/scripts and trims to a max length. Every free-text field a
 * user submits (ride comment, ferry notes, chat message, rating comment, DSA
 * notice explanation, bio) must go through this before it is stored —
 * plain text only, no markup.
 *
 * This used to run through isomorphic-dompurify (jsdom-based), but that pulls
 * in a transitive dependency (html-encoding-sniffer -> @exodus/bytes) that
 * ships as an ES Module in a way Vercel's serverless Node runtime can't
 * require() — it crashed every single route in production with
 * ERR_REQUIRE_ESM. A regex tag-stripper is all we actually need: nothing in
 * this app ever renders this text via dangerouslySetInnerHTML (grep the repo
 * — it doesn't happen), so React's normal text-node rendering is already the
 * real XSS defence. This function is a content-quality/defence-in-depth
 * layer on top of that, not the only thing standing between a user and XSS.
 */
export function sanitizePlainText(input: string, maxLength: number): string {
  const withoutTags = input.replace(/<[^>]*>/g, ' ')
  return withoutTags.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}
