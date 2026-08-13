import type { Metadata } from 'next'
import { requireProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { getAppSettings } from '@/lib/settings'
import { DRIVER_DECLARATION_VERSION } from '@/lib/config/legal'
import { TilbydLiftClient } from './TilbydLiftClient'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = { title: 'Tilbyd et lift' }

export default async function OfferRidePage() {
  const profile = await requireProfile('/log-ind?next=/tilbyd-lift')

  if (!profile.email_verified || !profile.phone_verified) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <Card>
          <h1 className="mb-2 text-xl font-semibold text-brand-dark">Bekræft din konto først</h1>
          <p className="mb-6 text-ink-500">
            Du skal have en bekræftet e-mail og et bekræftet telefonnummer, før du kan tilbyde et lift.
          </p>
          <LinkButton href="/bekraeft-telefon">Bekræft nu</LinkButton>
        </Card>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: ferryRoutes }, { data: declaration }, settings] = await Promise.all([
    supabase.from('ferry_routes').select('id, operator, departure_port, arrival_port').eq('active', true).order('operator'),
    supabase
      .from('driver_declarations')
      .select('id')
      .eq('user_id', profile.id)
      .eq('declaration_version', DRIVER_DECLARATION_VERSION)
      .maybeSingle(),
    getAppSettings(),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Tilbyd et lift</h1>
      <TilbydLiftClient
        ferryRoutes={ferryRoutes ?? []}
        pricingSettings={settings.pricing}
        declarationAccepted={!!declaration}
      />
    </div>
  )
}
