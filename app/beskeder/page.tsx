import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Beskeder', robots: { index: false } }

export default async function MessagesListPage() {
  const profile = await requireProfile('/log-ind?next=/beskeder')
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, driver_id, passenger_id, booking_id, created_at')
    .or(`driver_id.eq.${profile.id},passenger_id.eq.${profile.id}`)
    .order('created_at', { ascending: false })

  if (!conversations || conversations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Beskeder</h1>
        <p className="text-ink-500">Du har ingen samtaler endnu. De opstår, når en booking bliver accepteret.</p>
      </div>
    )
  }

  const counterpartIds = conversations.map((c) => (c.driver_id === profile.id ? c.passenger_id : c.driver_id))
  const bookingIds = conversations.map((c) => c.booking_id)

  const [{ data: counterparts }, { data: bookings }] = await Promise.all([
    supabase.from('public_profiles').select('id, first_name, avatar_url').in('id', counterpartIds),
    supabase.from('bookings').select('id, ride_id').in('id', bookingIds),
  ])

  const rideIds = (bookings ?? []).map((b) => b.ride_id)
  const { data: rides } = await supabase.from('rides').select('id, origin_name, destination_name').in('id', rideIds)

  const counterpartMap = new Map((counterparts ?? []).map((c) => [c.id, c]))
  const bookingMap = new Map((bookings ?? []).map((b) => [b.id, b]))
  const rideMap = new Map((rides ?? []).map((r) => [r.id, r]))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Beskeder</h1>
      <div className="space-y-3">
        {conversations.map((c) => {
          const counterpartId = c.driver_id === profile.id ? c.passenger_id : c.driver_id
          const counterpart = counterpartMap.get(counterpartId)
          const ride = rideMap.get(bookingMap.get(c.booking_id)?.ride_id ?? '')
          return (
            <Link key={c.id} href={`/beskeder/${c.id}`}>
              <Card className="flex items-center gap-3 hover:border-brand-green/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-neutral font-medium text-brand-dark">
                  {counterpart?.first_name?.charAt(0) ?? '?'}
                </span>
                <span>
                  <span className="block font-medium text-brand-dark">{counterpart?.first_name ?? 'Bruger'}</span>
                  {ride && <span className="block text-sm text-ink-500">{ride.origin_name} → {ride.destination_name}</span>}
                </span>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
