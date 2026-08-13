'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { submitRating } from '@/lib/actions/ratings'
import type { ActionResult } from '@/lib/actions/auth'
import { Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function RatingForm({ bookingId, rateeId, rateeName }: { bookingId: string; rateeId: string; rateeName: string }) {
  const [stars, setStars] = useState(5)
  const [state, formAction] = useFormState(submitRating, initialState)

  if (state.success) {
    return <p className="text-sm text-brand-green">Tak for din bedømmelse af {rateeName}.</p>
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-brand-neutral/50 p-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rateeId" value={rateeId} />
      <input type="hidden" name="stars" value={stars} />
      <p className="text-sm font-medium text-brand-dark">Bedøm {rateeName}</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Antal stjerner">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} stjerner`}
            onClick={() => setStars(n)}
            className={`min-h-[36px] min-w-[36px] rounded-lg text-xl ${n <= stars ? 'text-warning' : 'text-ink-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea name="comment" maxLength={500} placeholder="Kommentar (valgfrit)" />
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Sender…' : 'Send bedømmelse'}</Button>
}
