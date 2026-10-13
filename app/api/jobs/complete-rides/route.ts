import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Dagligt vedligeholdelsesjob (planlagt i vercel.json):
 *  1. Markerer accepterede bookinger som gennemført, når afgangen ligger længere tilbage end
 *     den konfigurerede frist (spec §18), så bedømmelser kan åbnes.
 *  2. Sletter udløbne data efter de opbevaringsperioder, privatlivspolitikken lover.
 *
 * Vercel Cron kalder med GET og sender automatisk `Authorization: Bearer $CRON_SECRET`, hvis
 * miljøvariablen CRON_SECRET er sat. POST bevares, så jobbet også kan startes manuelt.
 * Er CRON_SECRET ikke sat, afvises alle kald (ellers ville "Bearer undefined" slippe igennem).
 */
async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: completed, error } = await admin.rpc('auto_complete_past_rides')
  if (error) {
    console.error('auto_complete_past_rides_failed', error)
    return NextResponse.json({ error: 'job_failed' }, { status: 500 })
  }

  // Oprydning må ikke få hele jobbet til at fejle, hvis migrationen endnu ikke er kørt.
  const { data: purged, error: purgeError } = await admin.rpc('purge_expired_data')
  if (purgeError) console.error('purge_expired_data_failed', purgeError)

  return NextResponse.json({ completedBookings: completed, purged: purged ?? null })
}

export const GET = run
export const POST = run
