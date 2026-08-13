'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { saveFerryRoute } from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/auth'
import { Label, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export interface FerryRouteDefaults {
  id?: string
  operator?: string
  departurePort?: string
  arrivalPort?: string
  defaultDepartureTime?: string | null
  notes?: string | null
  active?: boolean
}

export function FerryRouteForm({ defaults }: { defaults?: FerryRouteDefaults }) {
  const [state, formAction] = useFormState(saveFerryRoute, initialState)

  return (
    <form action={formAction} className="space-y-3">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="operator">Operatør</Label>
          <Input id="operator" name="operator" defaultValue={defaults?.operator} required />
        </div>
        <div>
          <Label htmlFor="departurePort">Afgangshavn</Label>
          <Input id="departurePort" name="departurePort" defaultValue={defaults?.departurePort} required />
        </div>
        <div>
          <Label htmlFor="arrivalPort">Ankomsthavn</Label>
          <Input id="arrivalPort" name="arrivalPort" defaultValue={defaults?.arrivalPort} required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="defaultDepartureTime">Standard afgangstid (valgfrit)</Label>
          <Input id="defaultDepartureTime" name="defaultDepartureTime" type="time" defaultValue={defaults?.defaultDepartureTime ?? ''} />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm text-brand-dark">
          <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} className="h-4 w-4" />
          Aktiv (vises for brugere)
        </label>
      </div>
      <div>
        <Label htmlFor="notes">Noter (valgfrit)</Label>
        <Textarea id="notes" name="notes" maxLength={300} defaultValue={defaults?.notes ?? ''} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Gemmer…' : 'Gem færgerute'}</Button>
}
