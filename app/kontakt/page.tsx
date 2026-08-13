import type { Metadata } from 'next'
import { brand } from '@/lib/config/brand'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Kontakt' }

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-brand-dark">Kontakt</h1>

      <Card>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-500">Selskab</dt>
            <dd className="text-brand-dark">[COMPANY NAME]</dd>
          </div>
          <div>
            <dt className="text-ink-500">CVR</dt>
            <dd className="text-brand-dark">[CVR]</dd>
          </div>
          <div>
            <dt className="text-ink-500">Adresse</dt>
            <dd className="text-brand-dark">[ADDRESS]</dd>
          </div>
          <div>
            <dt className="text-ink-500">E-mail</dt>
            <dd className="text-brand-dark">{brand.supportEmail}</dd>
          </div>
        </dl>
      </Card>

      <p className="text-xs text-ink-500">
        [COMPANY NAME], [CVR], [ADDRESS] og [EMAIL] er placeholder-oplysninger og skal udfyldes med selskabets reelle
        oplysninger, før siden går i produktion — se README og /admin/juridisk.
      </p>
    </div>
  )
}
