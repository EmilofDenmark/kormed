'use client'

import { useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { updateNoticeStatus, hideReportedContent } from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/auth'
import { Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function NoticeDecisionForm({ noticeId, contentType, contentId }: { noticeId: string; contentType: string; contentId: string }) {
  const [state, formAction] = useFormState(updateNoticeStatus, initialState)
  const [pending, startTransition] = useTransition()
  const canHide = contentType === 'ride' || contentType === 'rating_comment'

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="noticeId" value={noticeId} />
        <Select name="status" defaultValue="UNDER_REVIEW" required>
          <option value="UNDER_REVIEW">Under behandling</option>
          <option value="ACTION_TAKEN">Der er handlet på anmeldelsen</option>
          <option value="NO_ACTION">Ingen handling</option>
          <option value="CLOSED">Afsluttet</option>
        </Select>
        <Textarea name="decisionReason" maxLength={2000} placeholder="Begrundelse (bruges internt, og kan deles med anmelderen)" />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <SubmitButton />
      </form>
      {canHide && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(async () => { await hideReportedContent(contentType, contentId) })}
        >
          Skjul det anmeldte indhold
        </Button>
      )}
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" variant="outline" disabled={pending}>{pending ? 'Gemmer…' : 'Opdater status'}</Button>
}
