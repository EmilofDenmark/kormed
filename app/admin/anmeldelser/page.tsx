import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { NoticeDecisionForm } from '@/components/admin/NoticeDecisionForm'
import { NoticeMessagesViewer } from '@/components/admin/NoticeMessagesViewer'

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Ny',
  UNDER_REVIEW: 'Under behandling',
  ACTION_TAKEN: 'Der er handlet',
  NO_ACTION: 'Ingen handling',
  CLOSED: 'Afsluttet',
}

export default async function AdminNoticesPage() {
  const supabase = await createClient()
  const { data: notices } = await supabase
    .from('content_notices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <Card className="border-warning/40 bg-warning/5">
        <p className="text-sm text-brand-dark">
          Anmeldelser slettes ikke automatisk indhold, blot fordi det er anmeldt. Vurder hver sag individuelt og
          registrer en begrundelse (Digital Services Act, spec §21).
        </p>
      </Card>

      {(!notices || notices.length === 0) && <p className="text-ink-500">Ingen anmeldelser endnu.</p>}

      {(notices ?? []).map((n) => (
        <Card key={n.id} className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-brand-dark">{n.content_type} · {n.content_id}</p>
              <p className="text-sm text-ink-500">Anmeldt af {n.reporter_email} · {new Date(n.created_at).toLocaleString('da-DK')}</p>
            </div>
            <Badge tone={n.status === 'NEW' ? 'warning' : n.status === 'ACTION_TAKEN' ? 'danger' : 'neutral'}>
              {STATUS_LABELS[n.status] ?? n.status}
            </Badge>
          </div>

          <p className="text-sm text-brand-dark">{n.explanation}</p>
          {n.legal_category && <p className="text-xs text-ink-500">Juridisk kategori: {n.legal_category}</p>}
          {n.url && <p className="text-xs text-ink-500">URL: {n.url}</p>}
          {n.decision_reason && <p className="text-sm italic text-ink-700">Tidligere begrundelse: {n.decision_reason}</p>}

          {n.content_type === 'message' && <NoticeMessagesViewer noticeId={n.id} />}

          <NoticeDecisionForm noticeId={n.id} contentType={n.content_type} contentId={n.content_id} />
        </Card>
      ))}
    </div>
  )
}
