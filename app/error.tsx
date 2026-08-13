'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Global error boundary. Never renders error.message/stack to the user
 * (spec §37) — only logs it server-side via console.error, which Next.js
 * routes to server logs, not the client bundle.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('unhandled_client_error', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Der opstod en fejl</h1>
      <p className="mb-6 text-ink-500">Noget gik galt. Prøv venligst igen.</p>
      <Button type="button" onClick={reset}>Prøv igen</Button>
    </div>
  )
}
