import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Log ind' }

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Log ind</h1>
      <Card>
        <LoginForm next={searchParams.next} />
      </Card>
    </div>
  )
}
