import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/session'
import { enrichRides } from '@/lib/rides/enrich'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/ui/RatingStars'
import { RouteMap } from '@/components/map/RouteMap'
import { FerryBadge } from '@/components/ride/FerryBadge'
import { LinkButton } from '@/components/ui/Button'
import { RequestSeatForm } from '@/components/booking/RequestSeatForm'
import { ReportContentLink } from '@/components/notices/ReportContentLink'
import { formatApproxTime, formatDateDaLong, formatDkk, luggageLabels, petsLabels, timeFlexibilityLabels } from '@/lib/format'

export const metadata: Metadata = { title: 'Tur', robots: { index: false } }

export default async function RideDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: ride } = await supabase.from('rides').select('*').eq('id', params.id).single()
  if (!ride) notFound()

  const [profile, [enrichedRide]] = await Promise.all([getCurrentProfile(), enrichRides(supabase, [ride])])
  // enrichRides([ride]) always returns exactly one entry for one input row.
  const enriched = enrichedRide!

  let existingBooking: { id: string; status: string } | null = null
  if (profile) {
    const { data } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('ride_id', ride.id)
      .eq('passenger_id', profile.id)
      .in('status', ['PENDING', 'ACCEPTED'])
      .maybeSingle()
    existingBooking = data
  }

  const isDriver = profile?.id === ride.driver_id
  const isBookable = ride.status === 'PUBLISHED' && ride.available_seats > 0

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-dark sm:text-3xl">
              {ride.origin_name} → {ride.destination_name}
            </h1>
            <p className="mt-1 text-ink-700">
              {formatDateDaLong(ride.departure_date)} · {formatApproxTime(ride.departure_time)}
              {ride.duration_minutes && ` · ca. ${Math.round(ride.duration_minutes / 60)} t ${ride.duration_minutes % 60} min`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{timeFlexibilityLabels[ride.time_flexibility]}</Badge>
              {ride.uses_ferry && enriched.ferryRoute && (
                <FerryBadge operator={enriched.ferryRoute.operator} departurePort={enriched.ferryRoute.departure_port} arrivalPort={enriched.ferryRoute.arrival_port} />
              )}
              {ride.status !== 'PUBLISHED' && <Badge tone="warning">{statusLabel(ride.status)}</Badge>}
            </div>
          </div>

          <RouteMap
            originName={ride.origin_name}
            originLat={ride.origin_lat}
            originLng={ride.origin_lng}
            destinationName={ride.destination_name}
            destinationLat={ride.destination_lat}
            destinationLng={ride.destination_lng}
            polyline={ride.route_polyline}
          />

          <Card className="space-y-2 bg-brand-neutral/40">
            <p className="text-sm text-brand-dark">
              Dette er samkørsel. Chaufføren skal allerede samme vej, og betalingen er alene et bidrag til turens
              omkostninger.
            </p>
            <p className="text-sm text-ink-500">Det præcise mødested aftales med chaufføren.</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-brand-dark">Detaljer</h2>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-ink-500">Ledige pladser</dt>
              <dd className="text-brand-dark">{ride.available_seats} af {ride.original_seats}</dd>
              <dt className="text-ink-500">Bagage</dt>
              <dd className="text-brand-dark">{luggageLabels[ride.luggage_option]}</dd>
              <dt className="text-ink-500">Kæledyr</dt>
              <dd className="text-brand-dark">{petsLabels[ride.pets_option]}</dd>
              <dt className="text-ink-500">Rygning</dt>
              <dd className="text-brand-dark">{ride.smoking ? 'Tilladt' : 'Ikke tilladt'}</dd>
              {ride.distance_km && (
                <>
                  <dt className="text-ink-500">Distance</dt>
                  <dd className="text-brand-dark">{ride.distance_km} km</dd>
                </>
              )}
              {ride.uses_ferry && ride.ferry_departure_time && (
                <>
                  <dt className="text-ink-500">Færgeafgang</dt>
                  <dd className="text-brand-dark">{ride.ferry_departure_time.slice(0, 5)}</dd>
                </>
              )}
            </dl>
            {ride.ferry_notes && <p className="mt-4 text-sm text-ink-700">⛴ {ride.ferry_notes}</p>}
            {ride.comment && <p className="mt-4 whitespace-pre-line text-sm text-ink-700">{ride.comment}</p>}
          </Card>

          <ReportContentLink contentType="ride" contentId={ride.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 text-center">
              <p className="text-2xl font-semibold text-brand-dark">{formatDkk(ride.seat_price)}</p>
              <p className="text-sm text-ink-500">pr. passager</p>
            </div>

            {enriched.driver && (
              <Link href={`/bruger/${enriched.driver.public_id}`} className="mb-4 flex items-center gap-3 rounded-xl p-2 hover:bg-brand-neutral">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-neutral text-brand-dark">
                  {enriched.driver.first_name.charAt(0)}
                </span>
                <span>
                  <span className="block font-medium text-brand-dark">{enriched.driver.first_name}</span>
                  <RatingStars value={enriched.driver.rating_avg} count={enriched.driver.rating_count} size="sm" />
                </span>
              </Link>
            )}

            {isDriver ? (
              <LinkButton href="/mine-ture" fullWidth variant="outline">Administrer din tur</LinkButton>
            ) : existingBooking ? (
              <p className="rounded-xl bg-brand-neutral p-4 text-center text-sm text-brand-dark">
                Du har allerede {existingBooking.status === 'PENDING' ? 'anmodet om' : 'fået accepteret'} en plads på denne tur.
              </p>
            ) : !profile ? (
              <LinkButton href={`/log-ind?next=/tur/${ride.id}`} fullWidth>Log ind for at anmode om plads</LinkButton>
            ) : !isBookable ? (
              <p className="rounded-xl bg-brand-neutral p-4 text-center text-sm text-brand-dark">Denne tur kan ikke længere bookes.</p>
            ) : !profile.email_verified || !profile.phone_verified ? (
              <div className="space-y-2 text-center">
                <p className="text-sm text-ink-700">Bekræft din e-mail og dit telefonnummer for at anmode om en plads.</p>
                <LinkButton href="/bekraeft-telefon" fullWidth variant="outline">Bekræft nu</LinkButton>
              </div>
            ) : (
              <RequestSeatForm rideId={ride.id} maxSeats={ride.available_seats} />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function statusLabel(status: string): string {
  switch (status) {
    case 'FULL': return 'Fuldt booket'
    case 'CANCELLED': return 'Aflyst'
    case 'COMPLETED': return 'Gennemført'
    default: return status
  }
}
