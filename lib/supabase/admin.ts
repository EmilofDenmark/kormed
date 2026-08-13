import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY — never import
 * this outside of a handful of trusted, narrowly-scoped server contexts:
 * the handle_new_user-adjacent server actions that need to read auth.users,
 * the /api/jobs/* cron endpoints, and GDPR export/delete. Every call site
 * using this client must independently verify the caller is authorised
 * (e.g. re-check the session, or the CRON_SECRET header) — this client does
 * not know who is asking.
 *
 * The 'server-only' import above makes any accidental client-bundle import
 * fail the build instead of silently shipping the service key to browsers.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
