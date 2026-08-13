'use client'

import { useState, useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { suspendUser, reactivateUser } from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function SuspendUserForm({ userId, suspended }: { userId: string; suspended: boolean }) {
  const [armed, setArmed] = useState(false)
  const [state, formAction] = useFormState(suspendUser, initialState)
  const [pending, startTransition] = useTransition()

  if (suspended) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => { await reactivateUser(userId) })}
      >
        Genaktiver
      </Button>
    )
  }

  if (!armed) {
    return <Button type="button" variant="outline" onClick={() => setArmed(true)}>Spær bruger</Button>
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input name="reason" placeholder="Årsag" required className="w-48" />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton />
      <Button type="button" variant="ghost" onClick={() => setArmed(false)}>Annuller</Button>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" variant="danger" disabled={pending}>{pending ? 'Spærrer…' : 'Bekræft'}</Button>
}
