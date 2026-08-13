'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { publishLegalDocument } from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/auth'
import { Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function LegalDocumentEditor({ type, currentContent, currentVersion }: { type: 'terms' | 'privacy'; currentContent: string; currentVersion: number }) {
  const [state, formAction] = useFormState(publishLegalDocument, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="type" value={type} />
      <p className="text-sm text-ink-500">Nuværende version: {currentVersion}. Udgivelse opretter en ny version og opdaterer siden med det samme.</p>
      <Textarea name="content" defaultValue={currentContent} className="min-h-[320px] font-mono text-sm" required />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-brand-green">Udgivet.</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Udgiver…' : 'Udgiv ny version'}</Button>
}
