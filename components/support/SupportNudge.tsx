import Link from 'next/link'

/**
 * Minimal, easy-to-ignore nudge shown after a completed ride (spec update
 * §11: "Optional after either journey: Enjoyed KørMed? → support the
 * project. This support step must always be skippable."). Deliberately a
 * single line of text, not a card/modal — there is nothing to dismiss
 * because it never blocks or interrupts anything.
 */
export function SupportNudge() {
  return (
    <p className="text-center text-sm text-ink-500">
      Nød du turen med KørMed?{' '}
      <Link href="/stoet-koermed" className="font-medium text-brand-green underline">
        Støt KørMed
      </Link>
    </p>
  )
}
