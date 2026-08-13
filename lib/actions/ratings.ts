'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizePlainText } from '@/lib/sanitize'
import { submitRatingSchema } from '@/lib/validation/rating'
import type { ActionResult } from './auth'

/**
 * Ratee is derived from the booking/ride here rather than trusted from the
 * form, so a mismatched client value can never rate the wrong person — RLS
 * (ratings_insert_own, spec §19/§25) independently enforces the same rule at
 * the database layer as defense in depth.
 */
export async function submitRating(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsedInput = submitRatingSchema.safeParse({
    bookingId: formData.get('bookingId'),
    rateeId: formData.get('rateeId'),
    stars: Number(formData.get('stars')),
    comment: formData.get('comment') || null,
  })
  if (!parsedInput.success) {
    return { success: false, error: 'Vælg venligst mellem 1 og 5 stjerner.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, passenger_id, ride_id, status')
    .eq('id', parsedInput.data.bookingId)
    .single()
  if (!booking || booking.status !== 'COMPLETED') {
    return { success: false, error: 'Du kan kun bedømme gennemførte ture.' }
  }

  const { data: ride } = await supabase.from('rides').select('driver_id').eq('id', booking.ride_id).single()
  if (!ride) return { success: false, error: 'Turen blev ikke fundet.' }

  const rateeId = user.id === booking.passenger_id ? ride.driver_id : booking.passenger_id
  if (user.id !== booking.passenger_id && user.id !== ride.driver_id) {
    return { success: false, error: 'Du har ikke adgang til at bedømme denne tur.' }
  }

  const { error } = await supabase.from('ratings').insert({
    booking_id: booking.id,
    rater_id: user.id,
    ratee_id: rateeId,
    stars: parsedInput.data.stars,
    comment: parsedInput.data.comment ? sanitizePlainText(parsedInput.data.comment, 500) : null,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Du har allerede bedømt denne tur.' }
    return { success: false, error: 'Kunne ikke gemme bedømmelsen. Prøv igen.' }
  }

  revalidatePath('/mine-ture')
  revalidatePath('/mine-bookinger')
  return { success: true }
}
