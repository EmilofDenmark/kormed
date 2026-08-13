import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Auto-completes rides/bookings whose departure passed the configured grace
 * period without being cancelled (spec §18). Meant to be triggered by an
 * external scheduler (Supabase cron, Vercel Cron, GitHub Actions — see
 * README "Drift") hitting this with the CRON_SECRET, not by users.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('auto_complete_past_rides')

  if (error) {
    console.error('auto_complete_past_rides_failed', error)
    return NextResponse.json({ error: 'job_failed' }, { status: 500 })
  }

  return NextResponse.json({ completedBookings: data })
}
