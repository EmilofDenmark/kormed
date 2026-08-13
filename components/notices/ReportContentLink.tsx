import Link from 'next/link'

/**
 * Discreet DSA "Anmeld ulovligt indhold" entry point (spec §21) — deliberately
 * small and unobtrusive, not a prominent "report user" button. Placed on
 * user-generated content: rides, public profiles, rating comments.
 */
export function ReportContentLink({ contentType, contentId }: { contentType: string; contentId: string }) {
  const href = `/anmeld-ulovligt-indhold?type=${encodeURIComponent(contentType)}&id=${encodeURIComponent(contentId)}`
  return (
    <p className="text-center text-xs text-ink-500">
      <Link href={href} className="underline hover:text-brand-dark">
        Anmeld ulovligt indhold
      </Link>
    </p>
  )
}
