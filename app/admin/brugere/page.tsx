import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { SuspendUserForm } from '@/components/admin/SuspendUserForm'

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createClient()
  const q = searchParams.q?.trim()

  let query = supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, email_verified, phone_verified, status, completed_rides_count, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: users } = await query

  return (
    <div className="space-y-4">
      <form method="GET" className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Søg efter navn eller e-mail" />
        <Button type="submit">Søg</Button>
      </form>

      <div className="space-y-3">
        {(users ?? []).map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-brand-dark">{u.first_name} {u.last_name}</p>
              <p className="text-sm text-ink-500">{u.email} · {u.phone ?? 'intet telefonnummer'}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={u.email_verified ? 'green' : 'neutral'}>E-mail {u.email_verified ? '✓' : '✗'}</Badge>
                <Badge tone={u.phone_verified ? 'green' : 'neutral'}>Telefon {u.phone_verified ? '✓' : '✗'}</Badge>
                <Badge tone="neutral">{u.completed_rides_count} ture</Badge>
                {u.status === 'suspended' && <Badge tone="danger">Spærret</Badge>}
                {u.status === 'deleted' && <Badge tone="neutral">Slettet</Badge>}
              </div>
            </div>
            {u.status !== 'deleted' && <SuspendUserForm userId={u.id} suspended={u.status === 'suspended'} />}
          </Card>
        ))}
        {(!users || users.length === 0) && <p className="text-ink-500">Ingen brugere fundet.</p>}
      </div>
    </div>
  )
}
