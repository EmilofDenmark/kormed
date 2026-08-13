'use client'

import { useState, useTransition } from 'react'
import { toggleFerryRouteActive } from '@/lib/actions/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FerryRouteForm, type FerryRouteDefaults } from './FerryRouteForm'

export function FerryRouteRow({ route }: { route: Required<FerryRouteDefaults> }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  if (editing) {
    return (
      <div className="rounded-xl border border-ink-300/20 p-4">
        <FerryRouteForm defaults={route} />
        <Button type="button" variant="ghost" className="mt-2" onClick={() => setEditing(false)}>Luk</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-300/20 p-4">
      <div>
        <p className="font-medium text-brand-dark">{route.operator}: {route.departurePort} → {route.arrivalPort}</p>
        <Badge tone={route.active ? 'green' : 'neutral'}>{route.active ? 'Aktiv' : 'Inaktiv'}</Badge>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>Rediger</Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => startTransition(async () => { await toggleFerryRouteActive(route.id!, !route.active) })}
        >
          {route.active ? 'Deaktiver' : 'Aktiver'}
        </Button>
      </div>
    </div>
  )
}
