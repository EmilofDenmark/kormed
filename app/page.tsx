import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { enrichRides } from '@/lib/rides/enrich'
import { SearchForm } from '@/components/search/SearchForm'
import { RideCard } from '@/components/ride/RideCard'
import { RideMap } from '@/components/map/RideMap'
import { LinkButton } from '@/components/ui/Button'
import { SupportPromoCard } from '@/components/support/SupportPromoCard'
import { brand } from '@/lib/config/brand'
import { getAppSettings } from '@/lib/settings'

export const metadata: Metadata = {
  description: `${brand.tagline} Find et lift eller tilbyd en ledig plads i din bil på danske ruter — inklusive med færge.`,
}

export default async function HomePage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .eq('status', 'PUBLISHED')
    .gte('departure_date', today)
    .order('departure_date', { ascending: true })
    .limit(9)

  const rideCards = await enrichRides(supabase, rides ?? [])
  const settings = await getAppSettings()

  return (
    <div>
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Skal du samme vej?</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Find et lift hos en, der allerede skal afsted – eller tilbyd en ledig plads i din bil.
          </p>

          <div className="mt-8 rounded-card bg-surface p-4 shadow-card sm:p-6">
            <SearchForm />
          </div>

          <div className="mt-4">
            <LinkButton href="/tilbyd-lift" variant="secondary">Tilbyd et lift</LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <h2 className="mb-4 text-xl font-semibold text-brand-dark">Kort over kommende ture</h2>
        <RideMap
          rides={rideCards.map((r) => ({ id: r.id, originName: r.origin_name, lat: r.origin_lat, lng: r.origin_lng, priceDkk: r.seat_price }))}
        />
      </section>

      <section className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <h2 className="mb-4 text-xl font-semibold text-brand-dark">Kommende ture</h2>
        {rideCards.length === 0 ? (
          <div className="rounded-card border border-dashed border-ink-300/40 p-10 text-center">
            <p className="text-ink-700">Der er ingen ture endnu.</p>
            <div className="mt-4">
              <LinkButton href="/tilbyd-lift" variant="primary">Tilbyd selv et lift</LinkButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rideCards.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </section>

      {/* Deliberately below all ride content, and visually secondary to
          "Find lift"/"Tilbyd lift" — see spec update §8/§10. */}
      {(settings.support.enabled || settings.wine.enabled) && (
        <section className="mx-auto max-w-content px-4 pb-14 sm:px-6">
          <SupportPromoCard
            supportEnabled={settings.support.enabled}
            wineEnabled={settings.wine.enabled}
            wineShopName={settings.wine.shopName}
            wineShopUrl={settings.wine.shopUrl}
          />
        </section>
      )}
    </div>
  )
}
