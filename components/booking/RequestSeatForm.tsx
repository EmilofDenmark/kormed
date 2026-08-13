'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { requestBooking } from '@/lib/actions/bookings'
import type { ActionResult } from '@/lib/actions/auth'
import { Label, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function RequestSeatForm({ rideId, maxSeats }: { rideId: string; maxSeats: number }) {
  const [state, formAction] = useFormState(requestBooking, initialState)

  if (state.success) {
    return (
      <div className="rounded-xl bg-brand-green/10 p-4 text-sm text-brand-dark">
        Din anmodning er sendt. Du får besked, når chaufføren har svaret.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="rideId" value={rideId} />
      <div>
        <Label htmlFor="seats">Antal pladser</Label>
        <Select id="seats" name="seats" defaultValue="1">
          {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="message">Besked til chaufføren (valgfrit)</Label>
        <Textarea id="message" name="message" maxLength={500} placeholder="Fx hvor du gerne vil samles op" />
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
      {pending ? 'Sender…' : 'Send anmodning'}
    </Button>
  )
}
