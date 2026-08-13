import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = { title: 'Bekræft din e-mail' }

export default function ConfirmEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <Card>
        <h1 className="mb-2 text-xl font-semibold text-brand-dark">Tjek din indbakke</h1>
        <p className="mb-6 text-ink-500">
          Vi har sendt dig en e-mail med et bekræftelseslink. Klik på linket for at bekræfte din konto — herefter kan
          du logge ind og bekræfte dit telefonnummer.
        </p>
        <LinkButton href="/log-ind" variant="outline">Til login</LinkButton>
      </Card>
    </div>
  )
}
