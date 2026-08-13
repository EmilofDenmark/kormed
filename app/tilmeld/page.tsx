import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'
import { Card } from '@/components/ui/Card'
import { brand } from '@/lib/config/brand'

export const metadata: Metadata = { title: 'Opret konto' }

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold text-brand-dark">Opret konto</h1>
      <p className="mb-6 text-ink-500">Du skal være mindst 18 år for at oprette en konto hos {brand.name}.</p>
      <Card>
        <SignupForm />
      </Card>
    </div>
  )
}
