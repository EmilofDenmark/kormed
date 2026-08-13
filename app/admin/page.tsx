import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [activeUsers, activeRides, bookingsTotal, ridesToday, pendingNotices, pendingSupport] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('rides').select('id', { count: 'exact', head: true }).in('status', ['PUBLISHED', 'FULL']),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('departure_date', today),
    supabase.from('content_notices').select('id', { count: 'exact', head: true }).in('status', ['NEW', 'UNDER_REVIEW']),
    supabase.from('support_contributions').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
  ])

  const stats = [
    { label: 'Aktive brugere', value: activeUsers.count ?? 0 },
    { label: 'Aktive ture', value: activeRides.count ?? 0 },
    { label: 'Bookinger i alt', value: bookingsTotal.count ?? 0 },
    { label: 'Ture i dag', value: ridesToday.count ?? 0 },
    { label: 'Ventende DSA-anmeldelser', value: pendingNotices.count ?? 0, highlight: (pendingNotices.count ?? 0) > 0 },
    { label: 'Afventende frivillige bidrag', value: pendingSupport.count ?? 0 },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className={s.highlight ? 'border-warning/40 bg-warning/5' : ''}>
          <p className="text-sm text-ink-500">{s.label}</p>
          <p className="mt-1 text-3xl font-semibold text-brand-dark">{s.value}</p>
        </Card>
      ))}
    </div>
  )
}
