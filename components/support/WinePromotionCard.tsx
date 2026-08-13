import { Card } from '@/components/ui/Card'

/**
 * Secondary, non-intrusive cross-promotion for Vin i Glasset (spec update
 * §4-§6). Always visually and contextually separate from ridesharing —
 * never placed near prices, search results, booking forms or chat (see
 * placements audited in app/page.tsx, components/nav/Footer.tsx,
 * app/stoet-koermed/page.tsx, app/mine-bookinger/page.tsx). Copy must never
 * connect wine/alcohol with driving or the journey itself.
 */
export function WinePromotionCard({
  shopName,
  shopUrl,
  promotionText,
  heading = 'Du kan også støtte os med et godt glas vin',
}: {
  shopName: string
  shopUrl: string
  promotionText: string
  heading?: string
}) {
  return (
    <Card className="border-brand-neutral bg-brand-neutral/30">
      <h3 className="mb-1.5 text-sm font-semibold text-brand-dark">{heading}</h3>
      <p className="mb-3 text-sm text-ink-700">{promotionText}</p>
      <a
        href={shopUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-green underline"
      >
        Besøg {shopName}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">(åbner i en ny fane, forlader KørMed)</span>
      </a>
    </Card>
  )
}
