'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { hideRideAdmin } from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function HideRideForm({ rideId }: { rideId: string }) {
  const [armed, setArmed] = useState(false)
  const [state, formAction] = useFormState(hideRideAdmin, initialState)

  if (!armed) {
    return <Button type="button" variant="outline" onClick={() => setArmed(true)}>Skjul/aflys tur</Button>
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="rideId" value={rideId} />
      <Input name="reason" placeholder="Årsag" required className="w-56" />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton />
      <Button type="button" variant="ghost" onClick={() => setArmed(false)}>Annuller</Button>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" variant="danger" disabled={pending}>{pending ? 'Skjuler…' : 'Bekræft'}</Button>
}
