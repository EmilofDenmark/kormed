import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { LegalDocumentEditor } from '@/components/admin/LegalDocumentEditor'

export default async function AdminLegalPage() {
  const supabase = await createClient()

  const [{ data: terms }, { data: privacy }] = await Promise.all([
    supabase.from('legal_documents').select('version, content').eq('type', 'terms').order('version', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('legal_documents').select('version, content').eq('type', 'privacy').order('version', { ascending: false }).limit(1).maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <Card className="border-warning/40 bg-warning/5">
        <p className="text-sm font-medium text-brand-dark">Kræver juridisk gennemgang før produktionslancering</p>
        <p className="text-sm text-ink-700">
          Den automatisk genererede tekst er en placeholder og udgør ikke juridisk rådgivning. Udskift [COMPANY NAME], [CVR], [ADDRESS] og [EMAIL], og få teksten gennemgået af en jurist.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Vilkår</h2>
        <LegalDocumentEditor type="terms" currentContent={terms?.content ?? ''} currentVersion={terms?.version ?? 0} />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Privatlivspolitik</h2>
        <LegalDocumentEditor type="privacy" currentContent={privacy?.content ?? ''} currentVersion={privacy?.version ?? 0} />
      </Card>
    </div>
  )
}
