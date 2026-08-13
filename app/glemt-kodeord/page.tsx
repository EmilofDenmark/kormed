import type { Metadata } from 'next'
import { PasswordResetRequestForm } from '@/components/auth/PasswordResetRequestForm'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Glemt adgangskode' }

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Glemt adgangskode</h1>
      <Card>
        <PasswordResetRequestForm />
      </Card>
    </div>
  )
}
