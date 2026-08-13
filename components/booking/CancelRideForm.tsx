'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { cancelRideByDriver } from '@/lib/actions/bookings'
import type { ActionResult } from '@/lib/actions/auth'
import { Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function CancelRideForm({ rideId }: { rideId: string }) {
  const [armed, setArmed] = useState(false)
  const [state, formAction] = useFormState(cancelRideByDriver, initialState)

  if (!armed) {
    return <Button type="button" variant="outline" onClick={() => setArmed(true)}>Aflys tur</Button>
  }

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-danger/30 bg-danger/5 p-3">
      <input type="hidden" name="rideId" value={rideId} />
      <p className="text-sm text-brand-dark">Alle accepterede og ventende passagerer får besked. Dette kan ikke fortrydes.</p>
      <Textarea name="reason" maxLength={300} placeholder="Årsag (valgfrit)" />
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton />
        <Button type="button" variant="ghost" onClick={() => setArmed(false)}>Fortryd</Button>
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" variant="danger" disabled={pending}>{pending ? 'Aflyser…' : 'Ja, aflys turen'}</Button>
}
