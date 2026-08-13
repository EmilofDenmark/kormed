'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateProfile } from '@/lib/actions/profile'
import type { ActionResult } from '@/lib/actions/auth'
import { Label, Input, Textarea, HelpText } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function ProfileEditForm({ firstName, bio }: { firstName: string; bio: string | null }) {
  const [state, formAction] = useFormState(updateProfile, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="firstName">Fornavn</Label>
        <Input id="firstName" name="firstName" defaultValue={firstName} required maxLength={60} />
        <HelpText>Vises offentligt på dine ture og din profil.</HelpText>
      </div>
      <div>
        <Label htmlFor="bio">Om mig (valgfrit)</Label>
        <Textarea id="bio" name="bio" defaultValue={bio ?? ''} maxLength={300} placeholder="Et par ord om dig selv…" />
      </div>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-brand-green" role="status">Gemt.</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Gemmer…' : 'Gem ændringer'}
    </Button>
  )
}
