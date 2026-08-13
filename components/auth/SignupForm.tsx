'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signUp, type ActionResult } from '@/lib/actions/auth'
import { Label, Input, FieldError, HelpText } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Fornavn</Label>
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
          <FieldError>{state.fieldErrors?.firstName}</FieldError>
        </div>
        <div>
          <Label htmlFor="lastName">Efternavn</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
          <FieldError>{state.fieldErrors?.lastName}</FieldError>
          <HelpText>Vises aldrig offentligt — kun dit fornavn er synligt for andre.</HelpText>
        </div>
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="phone">Mobilnummer</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+4512345678" autoComplete="tel" required />
        <FieldError>{state.fieldErrors?.phone}</FieldError>
        <HelpText>Bruges kun til verifikation og vises aldrig offentligt.</HelpText>
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Fødselsdato</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        <FieldError>{state.fieldErrors?.dateOfBirth}</FieldError>
        <HelpText>Du skal være mindst 18 år for at oprette en konto.</HelpText>
      </div>

      <div>
        <Label htmlFor="password">Adgangskode</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <div className="space-y-3 rounded-xl bg-brand-neutral/50 p-4">
        <label className="flex items-start gap-3 text-sm text-ink-700">
          <input type="checkbox" name="acceptedTerms" className="mt-1 h-4 w-4" required />
          <span>
            Jeg accepterer <Link href="/vilkaar" className="underline" target="_blank">vilkårene</Link> for brug af tjenesten.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-ink-700">
          <input type="checkbox" name="acceptedPrivacy" className="mt-1 h-4 w-4" required />
          <span>
            Jeg har læst <Link href="/privatliv" className="underline" target="_blank">privatlivspolitikken</Link>.
          </span>
        </label>
      </div>

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      <SubmitButton />

      <p className="text-center text-sm text-ink-500">
        Har du allerede en konto? <Link href="/log-ind" className="font-medium text-brand-dark underline">Log ind</Link>
      </p>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? 'Opretter konto…' : 'Opret konto'}
    </Button>
  )
}
