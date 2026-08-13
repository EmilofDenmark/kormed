import type { Metadata } from 'next'
import { NewPasswordForm } from '@/components/auth/NewPasswordForm'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Ny adgangskode' }

export default function NewPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Vælg en ny adgangskode</h1>
      <Card>
        <NewPasswordForm />
      </Card>
    </div>
  )
}
