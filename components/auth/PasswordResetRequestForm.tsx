'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { requestPasswordReset, type ActionResult } from '@/lib/actions/auth'
import { Label, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function PasswordResetRequestForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState)

  if (state.success) {
    return (
      <p className="text-sm text-brand-dark">
        Hvis der findes en konto med denne e-mail, har vi sendt et link til at nulstille adgangskoden.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
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
      {pending ? 'Sender…' : 'Send nulstillingslink'}
    </Button>
  )
}
