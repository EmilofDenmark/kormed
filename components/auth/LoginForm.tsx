'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { logIn, type ActionResult } from '@/lib/actions/auth'
import { Label, Input, FieldError } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(logIn, initialState)

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Adgangskode</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      <SubmitButton />

      <div className="flex items-center justify-between text-sm">
        <Link href="/glemt-kodeord" className="text-ink-500 underline hover:text-brand-dark">Glemt adgangskode?</Link>
        <Link href="/tilmeld" className="font-medium text-brand-dark underline">Opret konto</Link>
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? 'Logger ind…' : 'Log ind'}
    </Button>
  )
}
