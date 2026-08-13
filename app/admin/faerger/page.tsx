import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { FerryRouteForm } from '@/components/admin/FerryRouteForm'
import { FerryRouteRow } from '@/components/admin/FerryRouteRow'

export default async function AdminFerryRoutesPage() {
  const supabase = await createClient()
  const { data: routes } = await supabase
    .from('ferry_routes')
    .select('id, operator, departure_port, arrival_port, default_departure_time, notes, active')
    .order('operator')

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-brand-dark">Ny færgerute</h2>
        <FerryRouteForm />
      </Card>

      <div className="space-y-3">
        {(routes ?? []).map((r) => (
          <FerryRouteRow
            key={r.id}
            route={{
              id: r.id,
              operator: r.operator,
              departurePort: r.departure_port,
              arrivalPort: r.arrival_port,
              defaultDepartureTime: r.default_departure_time,
              notes: r.notes,
              active: r.active,
            }}
          />
        ))}
      </div>
    </div>
  )
}
