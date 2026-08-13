import 'server-only'
import { headers } from 'next/headers'
import { createClient } from './supabase/server'

/**
 * DB-backed rate limiting via the check_rate_limit RPC (spec §16/§25). Fails
 * OPEN (allows the request) if the check itself errors, since this is a
 * defense-in-depth layer, not the only control — server actions still
 * validate everything else. Failing closed here would let a transient DB
 * hiccup take down chat/signup for everyone.
 */
export async function checkRateLimit(bucketKey: string, maxHits: number, windowSeconds: number): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('rate_limit_check_failed', error)
    return true
  }

  return data === true
}

/** Best-effort client IP for rate-limiting unauthenticated actions (DSA notice submission). */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return h.get('x-real-ip') || 'unknown'
}
