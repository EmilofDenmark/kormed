'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { startSupportContribution } from '@/lib/actions/support'
import type { ActionResult } from '@/lib/actions/auth'
import { Label, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const initialState: ActionResult = { success: false }

export function SupportForm({
  suggestedAmounts,
  customAmountEnabled,
}: {
  suggestedAmounts: number[]
  customAmountEnabled: boolean
}) {
  const [state, formAction] = useFormState(startSupportContribution, initialState)
  const [choice, setChoice] = useState<string>(String(suggestedAmounts[0] ?? 25))

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-brand-dark">Vælg et beløb</legend>
        <div className="flex flex-wrap gap-2">
          {suggestedAmounts.map((amount) => (
            <label
              key={amount}
              className={cn(
                'flex min-h-[44px] cursor-pointer items-center rounded-pill border px-5 text-sm font-medium',
                choice === String(amount)
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-ink-300/40 text-ink-700 hover:bg-brand-neutral'
              )}
            >
              <input
                type="radio"
                name="amountChoice"
                value={amount}
                checked={choice === String(amount)}
                onChange={() => setChoice(String(amount))}
                className="sr-only"
              />
              {amount} kr.
            </label>
          ))}
          {customAmountEnabled && (
            <label
              className={cn(
                'flex min-h-[44px] cursor-pointer items-center rounded-pill border px-5 text-sm font-medium',
                choice === 'custom'
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-ink-300/40 text-ink-700 hover:bg-brand-neutral'
              )}
            >
              <input
                type="radio"
                name="amountChoice"
                value="custom"
                checked={choice === 'custom'}
                onChange={() => setChoice('custom')}
                className="sr-only"
              />
              Valgfrit beløb
            </label>
          )}
        </div>
      </fieldset>

      {choice === 'custom' && customAmountEnabled && (
        <div>
          <Label htmlFor="customAmount">Beløb (kr.)</Label>
          <Input id="customAmount" name="customAmount" type="number" min={1} step="1" required className="w-32" />
        </div>
      )}

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      <SubmitButton />

      <p className="text-xs text-ink-500">
        Frivilligt bidrag til driften. Det giver ingen særlige fordele på KørMed og påvirker aldrig søgeresultater
        eller bedømmelser.
      </p>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sender…' : 'Støt KørMed'}
    </Button>
  )
}
