import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { HideRideForm } from '@/components/admin/HideRideForm'
import { formatDateDaLong, formatDkk } from '@/lib/format'

export default async function AdminRidesPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createClient()
  const q = searchParams.q?.trim()

  let query = supabase
    .from('rides')
    .select('id, origin_name, destination_name, departure_date, seat_price, status, available_seats')
    .order('departure_date', { ascending: false })
    .limit(50)

  if (q) {
    query = query.or(`origin_name.ilike.%${q}%,destination_name.ilike.%${q}%`)
  }

  const { data: rides } = await query

  return (
    <div className="space-y-4">
      <form method="GET" className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Søg efter by" />
        <Button type="submit">Søg</Button>
      </form>

      <div className="space-y-3">
        {(rides ?? []).map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/tur/${r.id}`} className="font-medium text-brand-dark hover:underline">
                {r.origin_name} → {r.destination_name}
              </Link>
              <p className="text-sm text-ink-500">
                {formatDateDaLong(r.departure_date)} · {formatDkk(r.seat_price)} · {r.available_seats} ledige pladser
              </p>
              <Badge tone={r.status === 'CANCELLED' ? 'danger' : 'neutral'}>{r.status}</Badge>
            </div>
            {r.status !== 'CANCELLED' && <HideRideForm rideId={r.id} />}
          </Card>
        ))}
        {(!rides || rides.length === 0) && <p className="text-ink-500">Ingen ture fundet.</p>}
      </div>
    </div>
  )
}
