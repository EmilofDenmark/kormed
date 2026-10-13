import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata: Metadata = { title: 'Vilkår' }

export default async function TermsPage() {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('legal_documents')
    .select('content, version, requires_legal_review')
    .eq('type', 'terms')
    .not('published_at', 'is', null)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {doc?.requires_legal_review && (
        <p className="mb-6 rounded-xl bg-warning/10 p-3 text-sm text-warning">
          Denne tekst er endnu ikke gennemgået af en jurist og udgør ikke juridisk rådgivning.
        </p>
      )}
      {doc ? <LegalContent content={doc.content} /> : <p className="text-ink-500">Vilkårene er ikke udgivet endnu.</p>}
    </div>
  )
}
