import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { searchRides } from '@/lib/rides/search'
import { FilterForm } from '@/components/search/FilterForm'
import { RideCard } from '@/components/ride/RideCard'
import { RideMap } from '@/components/map/RideMap'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = { title: 'Find lift' }

interface SearchPageProps {
  searchParams: {
    fraName?: string
    fraLat?: string
    fraLng?: string
    tilName?: string
    tilLat?: string
    tilLng?: string
    dato?: string
    passagerer?: string
    faerge?: string
    faergeRuteId?: string
  }
}

export default async function FindLiftPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient()
  const { data: ferryRoutes } = await supabase
    .from('ferry_routes')
    .select('id, operator, departure_port, arrival_port')
    .eq('active', true)
    .order('operator')

  const params = {
    fraName: searchParams.fraName,
    fraLat: searchParams.fraLat ? Number(searchParams.fraLat) : undefined,
    fraLng: searchParams.fraLng ? Number(searchParams.fraLng) : undefined,
    tilName: searchParams.tilName,
    tilLat: searchParams.tilLat ? Number(searchParams.tilLat) : undefined,
    tilLng: searchParams.tilLng ? Number(searchParams.tilLng) : undefined,
    dato: searchParams.dato,
    passagerer: searchParams.passagerer ? Number(searchParams.passagerer) : 1,
    faerge: searchParams.faerge === '1',
    faergeRuteId: searchParams.faergeRuteId || undefined,
  }

  const results = await searchRides(params)

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Find lift</h1>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-card border border-ink-300/20 bg-surface p-5 shadow-card lg:sticky lg:top-20 lg:h-fit">
          <FilterForm
            defaultFrom={params.fraName}
            defaultTo={params.tilName}
            defaultDate={params.dato}
            defaultPassengers={params.passagerer}
            defaultFerry={params.faerge}
            defaultFerryRouteId={params.faergeRuteId}
            ferryRoutes={ferryRoutes ?? []}
          />
        </aside>

        <div className="space-y-8">
          <RideMap
            rides={results.map((r) => ({ id: r.id, originName: r.origin_name, lat: r.origin_lat, lng: r.origin_lng, priceDkk: r.seat_price }))}
            height={320}
          />

          {results.length === 0 ? (
            <div className="rounded-card border border-dashed border-ink-300/40 p-10 text-center">
              <p className="text-ink-700">Der er ingen ture, der matcher endnu.</p>
              <p className="mt-1 text-sm text-ink-500">Prøv en anden dato eller et lidt større område.</p>
              <div className="mt-4">
                <LinkButton href="/tilbyd-lift">Tilbyd selv et lift</LinkButton>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  matchNote={
                    ride.isPartialMatch && params.fraName
                      ? `Denne tur passerer tæt på ${params.fraName}.`
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <p className="text-center text-sm text-ink-500">Det præcise mødested aftales med chaufføren.</p>
          )}
        </div>
      </div>
    </div>
  )
}
