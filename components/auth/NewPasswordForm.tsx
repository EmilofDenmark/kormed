'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { setNewPassword, type ActionResult } from '@/lib/actions/auth'
import { Label, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function NewPasswordForm() {
  const [state, formAction] = useFormState(setNewPassword, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="password">Ny adgangskode</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? 'Gemmer…' : 'Gem ny adgangskode'}
    </Button>
  )
}
