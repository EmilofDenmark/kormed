import type { Metadata } from 'next'
import { getAppSettings } from '@/lib/settings'
import { Card } from '@/components/ui/Card'
import { SupportForm } from '@/components/support/SupportForm'
import { WinePromotionCard } from '@/components/support/WinePromotionCard'

export const metadata: Metadata = { title: 'Støt KørMed' }

export default async function SupportPage() {
  const settings = await getAppSettings()

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Hjælp med at holde KørMed kørende</h1>
        <p className="text-ink-700">
          KørMed er skabt for at gøre det nemmere at deles om turene på de danske veje. Det er gratis at finde og
          tilbyde lift, og sådan vil vi gerne holde det.
        </p>
        <p className="mt-3 text-ink-700">
          Hvis du har lyst til at hjælpe med udgifterne til drift og udvikling af KørMed, kan du give et frivilligt
          bidrag. Det er helt frivilligt og giver ingen særlige fordele på platformen.
        </p>
      </div>

      {settings.support.enabled ? (
        <Card>
          <SupportForm
            suggestedAmounts={settings.support.suggestedAmounts}
            customAmountEnabled={settings.support.customAmountEnabled}
          />
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-ink-500">Det er desværre ikke muligt at give et bidrag lige nu.</p>
        </Card>
      )}

      {settings.wine.enabled && (
        <WinePromotionCard
          shopName={settings.wine.shopName}
          shopUrl={settings.wine.shopUrl}
          promotionText={settings.wine.promotionText}
        />
      )}
    </div>
  )
}
