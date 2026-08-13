'use client'

import { useState, useTransition } from 'react'
import { acceptDriverDeclaration } from '@/lib/actions/rides'
import { DRIVER_DECLARATION_ITEMS } from '@/lib/config/legal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckIcon } from '@/components/ui/icons'

export function DriverDeclaration({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (!checked) return
    startTransition(async () => {
      const result = await acceptDriverDeclaration()
      if (result.success) {
        onAccepted()
      } else {
        setError(result.error ?? 'Der opstod en fejl.')
      }
    })
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-brand-dark">Før du opretter din første tur</h2>
      <p className="mb-4 text-sm text-ink-500">Bekræft venligst følgende, inden du kan tilbyde et lift:</p>
      <ul className="mb-5 space-y-2.5">
        {DRIVER_DECLARATION_ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
            <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-brand-green" />
            {item}
          </li>
        ))}
      </ul>
      <label className="mb-4 flex items-start gap-3 text-sm text-brand-dark">
        <input type="checkbox" className="mt-1 h-4 w-4" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        Jeg bekræfter, at alle ovenstående udsagn er korrekte.
      </label>
      {error && <p className="mb-3 text-sm text-danger" role="alert">{error}</p>}
      <Button type="button" fullWidth disabled={!checked || pending} onClick={handleSubmit}>
        {pending ? 'Bekræfter…' : 'Bekræft og fortsæt'}
      </Button>
    </Card>
  )
}
