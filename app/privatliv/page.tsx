import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata: Metadata = { title: 'Privatliv' }

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('legal_documents')
    .select('content, version, requires_legal_review')
    .eq('type', 'privacy')
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
      {doc ? <LegalContent content={doc.content} /> : <p className="text-ink-500">Privatlivspolitikken er ikke udgivet endnu.</p>}

      <div className="mt-10 rounded-card border border-ink-300/20 bg-brand-neutral/40 p-5">
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Dine rettigheder</h2>
        <p className="mb-3 text-sm text-ink-700">
          Du kan til enhver tid downloade en kopi af dine oplysninger eller slette din konto under din profil.
        </p>
        <Link href="/profil" className="text-sm font-medium text-brand-green underline">Gå til Min profil</Link>
      </div>
    </div>
  )
}
