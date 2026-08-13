import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import { BookingRequestActions } from '@/components/booking/BookingRequestActions'
import { CancelRideForm } from '@/components/booking/CancelRideForm'
import { CompleteBookingButton } from '@/components/booking/CompleteBookingButton'
import { RatingForm } from '@/components/rating/RatingForm'
import { formatApproxTime, formatDateDaLong, formatDkk } from '@/lib/format'

export const metadata: Metadata = { title: 'Mine ture', robots: { index: false } }

export default async function MyRidesPage() {
  const profile = await requireProfile('/log-ind?next=/mine-ture')
  const supabase = await createClient()

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .eq('driver_id', profile.id)
    .order('departure_date', { ascending: false })

  if (!rides || rides.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Mine ture</h1>
        <p className="mb-6 text-ink-500">Du har ikke oprettet nogen ture endnu.</p>
        <LinkButton href="/tilbyd-lift">Tilbyd et lift</LinkButton>
      </div>
    )
  }

  const rideIds = rides.map((r) => r.id)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, ride_id, passenger_id, seats, message, status')
    .in('ride_id', rideIds)
    .in('status', ['PENDING', 'ACCEPTED', 'COMPLETED'])

  const passengerIds = (bookings ?? []).map((b) => b.passenger_id)
  const { data: passengers } = passengerIds.length
    ? await supabase.from('public_profiles').select('id, first_name, public_id').in('id', passengerIds)
    : { data: [] as { id: string; first_name: string; public_id: string }[] }
  const passengerMap = new Map((passengers ?? []).map((p) => [p.id, p]))

  const bookingIds = (bookings ?? []).filter((b) => b.status === 'ACCEPTED').map((b) => b.id)
  const { data: conversations } = bookingIds.length
    ? await supabase.from('conversations').select('id, booking_id').in('booking_id', bookingIds)
    : { data: [] as { id: string; booking_id: string }[] }
  const conversationByBooking = new Map((conversations ?? []).map((c) => [c.booking_id, c.id]))

  const completedBookingIds = (bookings ?? []).filter((b) => b.status === 'COMPLETED').map((b) => b.id)
  const { data: myRatings } = completedBookingIds.length
    ? await supabase.from('ratings').select('booking_id').eq('rater_id', profile.id).in('booking_id', completedBookingIds)
    : { data: [] as { booking_id: string }[] }
  const ratedBookingIds = new Set((myRatings ?? []).map((r) => r.booking_id))

  const bookingsByRide = new Map<string, typeof bookings>()
  for (const b of bookings ?? []) {
    const list = bookingsByRide.get(b.ride_id) ?? []
    list.push(b)
    bookingsByRide.set(b.ride_id, list)
  }

  const now = Date.now()

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-dark">Mine ture</h1>
        <LinkButton href="/tilbyd-lift" variant="secondary">Tilbyd et lift</LinkButton>
      </div>

      {rides.map((ride) => {
        const rideBookings = bookingsByRide.get(ride.id) ?? []
        const pending = rideBookings.filter((b) => b.status === 'PENDING')
        const accepted = rideBookings.filter((b) => b.status === 'ACCEPTED')
        const completed = rideBookings.filter((b) => b.status === 'COMPLETED')
        const departurePassed = new Date(`${ride.departure_date}T${ride.departure_time}`).getTime() < now

        return (
          <Card key={ride.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/tur/${ride.id}`} className="text-lg font-semibold text-brand-dark hover:underline">
                  {ride.origin_name} → {ride.destination_name}
                </Link>
                <p className="text-sm text-ink-500">
                  {formatDateDaLong(ride.departure_date)} · {formatApproxTime(ride.departure_time)} · {formatDkk(ride.seat_price)} pr. person
                </p>
              </div>
              <Badge tone={ride.status === 'CANCELLED' ? 'danger' : ride.status === 'COMPLETED' ? 'neutral' : 'green'}>
                {rideStatusLabel(ride.status)}
              </Badge>
            </div>

            {pending.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-dark">Ventende anmodninger</p>
                {pending.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-neutral/50 p-3">
                    <span className="text-sm text-brand-dark">
                      {passengerMap.get(b.passenger_id)?.first_name ?? 'Passager'} vil gerne have {b.seats} {b.seats === 1 ? 'plads' : 'pladser'}
                      {b.message && <span className="block text-ink-500">&ldquo;{b.message}&rdquo;</span>}
                    </span>
                    <BookingRequestActions bookingId={b.id} />
                  </div>
                ))}
              </div>
            )}

            {accepted.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-dark">Accepterede passagerer</p>
                {accepted.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-green/5 p-3">
                    <span className="text-sm text-brand-dark">
                      {passengerMap.get(b.passenger_id)?.first_name ?? 'Passager'} · {b.seats} {b.seats === 1 ? 'plads' : 'pladser'}
                    </span>
                    <div className="flex gap-2">
                      {conversationByBooking.has(b.id) && (
                        <LinkButton href={`/beskeder/${conversationByBooking.get(b.id)}`} variant="outline">Chat</LinkButton>
                      )}
                      {departurePassed && <CompleteBookingButton bookingId={b.id} />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-dark">Gennemførte passagerer</p>
                {completed.map((b) =>
                  ratedBookingIds.has(b.id) ? (
                    <p key={b.id} className="rounded-xl bg-brand-neutral/40 p-3 text-sm text-ink-500">
                      Du har bedømt {passengerMap.get(b.passenger_id)?.first_name ?? 'denne passager'}.
                    </p>
                  ) : (
                    <RatingForm
                      key={b.id}
                      bookingId={b.id}
                      rateeId={b.passenger_id}
                      rateeName={passengerMap.get(b.passenger_id)?.first_name ?? 'passageren'}
                    />
                  )
                )}
              </div>
            )}

            {ride.status === 'PUBLISHED' || ride.status === 'FULL' ? <CancelRideForm rideId={ride.id} /> : null}
          </Card>
        )
      })}
    </div>
  )
}

function rideStatusLabel(status: string): string {
  switch (status) {
    case 'PUBLISHED': return 'Aktiv'
    case 'FULL': return 'Fuldt booket'
    case 'CANCELLED': return 'Aflyst'
    case 'COMPLETED': return 'Gennemført'
    default: return status
  }
}
