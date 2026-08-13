import type { Metadata } from 'next'
import { ContentNoticeForm } from '@/components/notices/ContentNoticeForm'

export const metadata: Metadata = { title: 'Anmeld ulovligt indhold' }

export default function ReportContentPage({ searchParams }: { searchParams: { type?: string; id?: string } }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Anmeld ulovligt indhold</h1>
      <p className="mb-6 text-ink-500">
        Brug denne formular til at anmelde indhold på siden, som du mener er ulovligt. Vi behandler alle anmeldelser
        individuelt og fjerner ikke automatisk indhold, blot fordi det er anmeldt.
      </p>
      <ContentNoticeForm defaultType={searchParams.type} defaultId={searchParams.id} />
    </div>
  )
}
