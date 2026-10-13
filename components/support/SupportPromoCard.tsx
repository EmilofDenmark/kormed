import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

/**
 * Compact "Støt KørMed" card for secondary placements (bottom of homepage,
 * support page, occasionally the dashboard — spec update §5). Deliberately
 * plain/small relative to the ridesharing CTAs (Find lift / Tilbyd lift) —
 * never render this above or beside them.
 */
export function SupportPromoCard({
  supportEnabled,
  wineEnabled,
  wineShopName,
  wineShopUrl,
}: {
  supportEnabled: boolean
  wineEnabled: boolean
  wineShopName: string
  wineShopUrl: string
}) {
  if (!supportEnabled && !wineEnabled) return null

  return (
    <Card className="bg-brand-neutral/40">
      <h3 className="mb-1 text-base font-semibold text-brand-dark">Støt KørMed</h3>
      <p className="mb-4 text-sm text-ink-700">
        KørMed er gratis at bruge. Har du lyst til at hjælpe med at holde siden kørende, kan du give et frivilligt
        bidrag{wineEnabled ? ' – eller besøge vores egen vinforretning, Vin i Glasset.' : '.'}
      </p>
      <div className="flex flex-wrap gap-3">
        {supportEnabled && (
          <LinkButton href="/stoet-koermed" variant="outline">
            Støt KørMed
          </LinkButton>
        )}
        {wineEnabled && (
          <a
            href={wineShopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-pill px-5 text-[15px] font-medium text-brand-dark hover:bg-brand-neutral"
          >
            Besøg {wineShopName}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </Card>
  )
}
