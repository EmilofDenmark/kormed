import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GDPR data export ("Download mine oplysninger", spec §23). Returns every
 * row the signed-in user owns, scoped explicitly per table (not just relying
 * on RLS, since e.g. ratings are publicly readable and need an extra filter
 * to only include this user's own rater/ratee rows).
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind.' }, { status: 401 })
  }

  const [profile, rides, bookings, ratingsGiven, ratingsReceived, legalAcceptances, driverDeclarations, notifications] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('rides').select('*').eq('driver_id', user.id),
      supabase.from('bookings').select('*').eq('passenger_id', user.id),
      supabase.from('ratings').select('*').eq('rater_id', user.id),
      supabase.from('ratings').select('*').eq('ratee_id', user.id),
      supabase.from('legal_acceptances').select('*').eq('user_id', user.id),
      supabase.from('driver_declarations').select('*').eq('user_id', user.id),
      supabase.from('notifications').select('*').eq('user_id', user.id),
    ])

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    rides_as_driver: rides.data,
    bookings_as_passenger: bookings.data,
    ratings_given: ratingsGiven.data,
    ratings_received: ratingsReceived.data,
    legal_acceptances: legalAcceptances.data,
    driver_declarations: driverDeclarations.data,
    notifications: notifications.data,
    note: 'Chatbeskeder indgår ikke i denne fil, da de også indeholder den anden deltagers kommunikation — kontakt os på support hvis du ønsker en kopi af dine egne beskeder.',
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mine-oplysninger.json"',
    },
  })
}
