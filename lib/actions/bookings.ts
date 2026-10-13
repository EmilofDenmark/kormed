'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { sanitizePlainText } from '@/lib/sanitize'
import { requestBookingSchema, cancelBookingSchema, cancelRideSchema, respondBookingSchema } from '@/lib/validation/booking'
import type { ActionResult } from './auth'

// Maps the RPCs' plain-text RAISE EXCEPTION codes (see
// supabase/migrations/20260101000008_booking_rpcs.sql) to Danish user-facing
// copy. Never show a raw Postgres error to the user (spec §37).
function toUserMessage(message: string): string {
  if (message.includes('ride_not_bookable')) return 'Denne tur kan ikke længere bookes.'
  if (message.includes('cannot_book_own_ride')) return 'Du kan ikke booke din egen tur.'
  if (message.includes('not_enough_seats')) return 'Der er ikke nok ledige pladser.'
  if (message.includes('account_suspended')) return 'Din konto er udelukket og kan ikke bruges til at booke.'
  if (message.includes('account_not_verified')) return 'Du skal bekræfte din e-mail, før du kan booke.'
  if (message.includes('booking_not_pending')) return 'Denne anmodning er allerede besvaret.'
  if (message.includes('booking_not_cancellable')) return 'Denne booking kan ikke længere aflyses.'
  if (message.includes('booking_not_completable')) return 'Denne booking kan ikke markeres som gennemført endnu.'
  if (message.includes('ride_not_cancellable')) return 'Denne tur kan ikke længere aflyses.'
  if (message.includes('not_authorized')) return 'Du har ikke adgang til at gøre dette.'
  return 'Der opstod en fejl. Prøv venligst igen.'
}

export async function requestBooking(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = requestBookingSchema.safeParse({
    rideId: formData.get('rideId'),
    seats: Number(formData.get('seats')),
    message: formData.get('message') || null,
  })
  if (!parsed.success) {
    return { success: false, error: 'Udfyld venligst felterne korrekt.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind for at anmode om en plads.' }

  const allowed = await checkRateLimit(`request-booking:${user.id}`, 20, 3600)
  if (!allowed) return { success: false, error: 'For mange anmodninger. Prøv igen senere.' }

  const { error } = await supabase.rpc('request_booking', {
    p_ride_id: parsed.data.rideId,
    p_seats: parsed.data.seats,
    p_message: parsed.data.message ? sanitizePlainText(parsed.data.message, 500) : null,
  })

  if (error) return { success: false, error: toUserMessage(error.message) }

  revalidatePath(`/tur/${parsed.data.rideId}`)
  revalidatePath('/mine-bookinger')
  return { success: true }
}

export async function acceptBooking(bookingId: string): Promise<ActionResult> {
  const parsed = respondBookingSchema.safeParse({ bookingId })
  if (!parsed.success) return { success: false, error: 'Ugyldig booking.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('accept_booking', { p_booking_id: parsed.data.bookingId })
  if (error) return { success: false, error: toUserMessage(error.message) }

  revalidatePath('/mine-ture')
  return { success: true }
}

export async function rejectBooking(bookingId: string): Promise<ActionResult> {
  const parsed = respondBookingSchema.safeParse({ bookingId })
  if (!parsed.success) return { success: false, error: 'Ugyldig booking.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_booking', { p_booking_id: parsed.data.bookingId })
  if (error) return { success: false, error: toUserMessage(error.message) }

  revalidatePath('/mine-ture')
  return { success: true }
}

export async function cancelBookingByPassenger(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = cancelBookingSchema.safeParse({
    bookingId: formData.get('bookingId'),
    reason: formData.get('reason') || null,
  })
  if (!parsed.success) return { success: false, error: 'Ugyldig booking.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_booking_by_passenger', {
    p_booking_id: parsed.data.bookingId,
    p_reason: parsed.data.reason ? sanitizePlainText(parsed.data.reason, 300) : null,
  })
  if (error) return { success: false, error: toUserMessage(error.message) }

  revalidatePath('/mine-bookinger')
  return { success: true }
}

export async function cancelRideByDriver(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = cancelRideSchema.safeParse({
    rideId: formData.get('rideId'),
    reason: formData.get('reason') || null,
  })
  if (!parsed.success) return { success: false, error: 'Ugyldig tur.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_ride_by_driver', {
    p_ride_id: parsed.data.rideId,
    p_reason: parsed.data.reason ? sanitizePlainText(parsed.data.reason, 300) : null,
  })
  if (error) return { success: false, error: toUserMessage(error.message) }

  revalidatePath('/mine-ture')
  return { success: true }
}

export async function completeBooking(bookingId: string): Promise<ActionResult> {
  const parsed = respondBookingSchema.safeParse({ bookingId })
  if (!parsed.success) return { success: false, error: 'Ugyldig booking.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('complete_booking', { p_booking_id: parsed.data.bookingId })
  if (error) return { success: false, error: toUserMessage(error.message) }

  revalidatePath('/mine-ture')
  revalidatePath('/mine-bookinger')
  return { success: true }
}
