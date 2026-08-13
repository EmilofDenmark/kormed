import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import { CancelBookingForm } from '@/components/booking/CancelBookingForm'
import { CompleteBookingButton } from '@/components/booking/CompleteBookingButton'
import { RatingForm } from '@/components/rating/RatingForm'
import { SupportNudge } from '@/components/support/SupportNudge'
import { formatApproxTime, formatDateDaLong, formatDkk } from '@/lib/format'
import { getAppSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Mine bookinger', robots: { index: false } }

export default async function MyBookingsPage() {
  const profile = await requireProfile('/log-ind?next=/mine-bookinger')
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, ride_id, seats, status, requested_at')
    .eq('passenger_id', profile.id)
    .order('requested_at', { ascending: false })

  if (!bookings || bookings.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Mine bookinger</h1>
        <p className="mb-6 text-ink-500">Du har ikke booket nogen ture endnu.</p>
        <LinkButton href="/find-lift">Find lift</LinkButton>
      </div>
    )
  }

  const rideIds = bookings.map((b) => b.ride_id)
  const { data: rides } = await supabase.from('rides').select('*').in('id', rideIds)
  const rideMap = new Map((rides ?? []).map((r) => [r.id, r]))

  const acceptedIds = bookings.filter((b) => b.status === 'ACCEPTED').map((b) => b.id)
  const { data: conversations } = acceptedIds.length
    ? await supabase.from('conversations').select('id, booking_id').in('booking_id', acceptedIds)
    : { data: [] as { id: string; booking_id: string }[] }
  const conversationByBooking = new Map((conversations ?? []).map((c) => [c.booking_id, c.id]))

  const driverIds = Array.from(new Set((rides ?? []).map((r) => r.driver_id)))
  const { data: drivers } = driverIds.length
    ? await supabase.from('public_profiles').select('id, first_name').in('id', driverIds)
    : { data: [] as { id: string; first_name: string }[] }
  const driverMap = new Map((drivers ?? []).map((d) => [d.id, d]))

  const completedIds = bookings.filter((b) => b.status === 'COMPLETED').map((b) => b.id)
  const { data: myRatings } = completedIds.length
    ? await supabase.from('ratings').select('booking_id').eq('rater_id', profile.id).in('booking_id', completedIds)
    : { data: [] as { booking_id: string }[] }
  const ratedBookingIds = new Set((myRatings ?? []).map((r) => r.booking_id))

  const settings = await getAppSettings()
  const hasCompletedBooking = bookings.some((b) => b.status === 'COMPLETED')

  const now = Date.now()

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Mine bookinger</h1>
      {bookings.map((b) => {
        const ride = rideMap.get(b.ride_id)
        if (!ride) return null
        const departurePassed = new Date(`${ride.departure_date}T${ride.departure_time}`).getTime() < now

        return (
          <Card key={b.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/tur/${ride.id}`} className="text-lg font-semibold text-brand-dark hover:underline">
                  {ride.origin_name} → {ride.destination_name}
                </Link>
                <p className="text-sm text-ink-500">
                  {formatDateDaLong(ride.departure_date)} · {formatApproxTime(ride.departure_time)} · {b.seats} {b.seats === 1 ? 'plads' : 'pladser'} · {formatDkk(ride.seat_price * b.seats)}
                </p>
              </div>
              <Badge tone={statusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {b.status === 'ACCEPTED' && conversationByBooking.has(b.id) && (
                <LinkButton href={`/beskeder/${conversationByBooking.get(b.id)}`} variant="outline">Chat med chauffør</LinkButton>
              )}
              {(b.status === 'PENDING' || b.status === 'ACCEPTED') && <CancelBookingForm bookingId={b.id} />}
              {b.status === 'ACCEPTED' && departurePassed && <CompleteBookingButton bookingId={b.id} />}
            </div>

            {b.status === 'COMPLETED' && (
              ratedBookingIds.has(b.id) ? (
                <p className="rounded-xl bg-brand-neutral/40 p-3 text-sm text-ink-500">
                  Du har bedømt {driverMap.get(ride.driver_id)?.first_name ?? 'chaufføren'}.
                </p>
              ) : (
                <RatingForm bookingId={b.id} rateeId={ride.driver_id} rateeName={driverMap.get(ride.driver_id)?.first_name ?? 'chaufføren'} />
              )
            )}
          </Card>
        )
      })}

      {hasCompletedBooking && settings.support.enabled && (
        <div className="pt-4">
          <SupportNudge />
        </div>
      )}
    </div>
  )
}

function bookingStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'Afventer svar'
    case 'ACCEPTED': return 'Accepteret'
    case 'REJECTED': return 'Afvist'
    case 'CANCELLED_BY_DRIVER': return 'Aflyst af chauffør'
    case 'CANCELLED_BY_PASSENGER': return 'Aflyst af dig'
    case 'COMPLETED': return 'Gennemført'
    default: return status
  }
}

function statusTone(status: string): 'green' | 'warning' | 'danger' | 'neutral' {
  if (status === 'ACCEPTED' || status === 'COMPLETED') return 'green'
  if (status === 'PENDING') return 'warning'
  if (status.startsWith('CANCELLED') || status === 'REJECTED') return 'danger'
  return 'neutral'
}
