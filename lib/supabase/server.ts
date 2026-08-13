import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Server Supabase client for use in Server Components, Route Handlers and
 * Server Actions. Runs as the signed-in user (anon key + their session
 * cookie), so RLS still applies — this is NOT a privilege escalation, just
 * the server-side equivalent of the browser client.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component with no writable response — the
            // middleware below refreshes the session on every request, so
            // this is safe to ignore.
          }
        },
      },
    }
  )
}
