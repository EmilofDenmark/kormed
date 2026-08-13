'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitContentNotice } from '@/lib/actions/notices'
import type { ActionResult } from '@/lib/actions/auth'
import { Label, Input, Select, Textarea, HelpText } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const initialState: ActionResult = { success: false }

const LEGAL_CATEGORIES = [
  'Ærekrænkelse / bagvaskelse',
  'Chikane eller trusler',
  'Svindel eller bedrageri',
  'Diskrimination',
  'Krænkelse af ophavsret',
  'Andet',
]

export function ContentNoticeForm({ defaultType, defaultId }: { defaultType?: string; defaultId?: string }) {
  const [state, formAction] = useFormState(submitContentNotice, initialState)

  if (state.success) {
    return (
      <Card>
        <p className="text-brand-dark">Tak for din anmeldelse. Vi gennemgår den og vender tilbage, hvis det er relevant.</p>
      </Card>
    )
  }

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contentType">Type af indhold</Label>
            <Select id="contentType" name="contentType" defaultValue={defaultType ?? 'ride'} required>
              <option value="ride">Tur</option>
              <option value="profile">Profil</option>
              <option value="rating_comment">Bedømmelseskommentar</option>
              <option value="message">Besked</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="contentId">ID på indholdet</Label>
            <Input id="contentId" name="contentId" defaultValue={defaultId} required />
            <HelpText>Kan findes i webadressen for turen/profilen.</HelpText>
          </div>
        </div>

        <div>
          <Label htmlFor="url">Link (valgfrit)</Label>
          <Input id="url" name="url" type="url" placeholder="https://…" />
        </div>

        <div>
          <Label htmlFor="reporterEmail">Din e-mail</Label>
          <Input id="reporterEmail" name="reporterEmail" type="email" required />
        </div>

        <div>
          <Label htmlFor="legalCategory">Juridisk kategori (valgfrit)</Label>
          <Select id="legalCategory" name="legalCategory" defaultValue="">
            <option value="">Vælg…</option>
            {LEGAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="explanation">Hvorfor mener du, at indholdet kan være ulovligt?</Label>
          <Textarea id="explanation" name="explanation" maxLength={2000} required minLength={10} />
        </div>

        <label className="flex items-start gap-3 text-sm text-brand-dark">
          <input type="checkbox" name="goodFaithConfirmed" required className="mt-1 h-4 w-4" />
          Jeg erklærer i god tro, at oplysningerne i denne anmeldelse er korrekte og fuldstændige.
        </label>

        {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
        <SubmitButton />
      </form>
    </Card>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Sender…' : 'Send anmeldelse'}</Button>
}
