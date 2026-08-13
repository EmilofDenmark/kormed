import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/session'

export const metadata: Metadata = { title: 'Administration', robots: { index: false } }

const NAV = [
  { href: '/admin', label: 'Oversigt' },
  { href: '/admin/brugere', label: 'Brugere' },
  { href: '/admin/ture', label: 'Ture' },
  { href: '/admin/faerger', label: 'Færger' },
  { href: '/admin/priser', label: 'Priser og indstillinger' },
  { href: '/admin/stoette', label: 'Støtte og Vin i Glasset' },
  { href: '/admin/juridisk', label: 'Juridisk' },
  { href: '/admin/anmeldelser', label: 'Anmeldelser (DSA)' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-brand-dark">Administration</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Administrationsmenu" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-neutral"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  )
}
