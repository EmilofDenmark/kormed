'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createRideSchema } from '@/lib/validation/ride'
import { sanitizePlainText } from '@/lib/sanitize'
import { geo, GeoProviderError } from '@/lib/geo'
import { getAppSettings } from '@/lib/settings'
import { computeMaxContribution, isSeatPriceWithinCap } from '@/lib/pricing/costSharing'
import { sampleRoutePoints } from '@/lib/matching/partialRoute'
import { DRIVER_DECLARATION_VERSION } from '@/lib/config/legal'
import { canPublishRide, isVerified } from '@/lib/eligibility'
import type { ActionResult } from './auth'

export async function acceptDriverDeclaration(): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const { error } = await supabase
    .from('driver_declarations')
    .insert({ user_id: user.id, declaration_version: DRIVER_DECLARATION_VERSION })

  if (error) return { success: false, error: 'Kunne ikke gemme din bekræftelse. Prøv igen.' }
  return { success: true }
}

function num(formData: FormData, key: string): number | undefined {
  const raw = formData.get(key)
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export async function createRide(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    origin: {
      name: String(formData.get('originName') || ''),
      lat: num(formData, 'originLat'),
      lng: num(formData, 'originLng'),
    },
    destination: {
      name: String(formData.get('destinationName') || ''),
      lat: num(formData, 'destinationLat'),
      lng: num(formData, 'destinationLng'),
    },
    departureDate: String(formData.get('departureDate') || ''),
    departureTime: String(formData.get('departureTime') || ''),
    timeFlexibility: String(formData.get('timeFlexibility') || 'exact'),
    usesFerry: formData.get('usesFerry') === 'on',
    ferryRouteId: (formData.get('ferryRouteId') as string) || null,
    ferryDepartureTime: (formData.get('ferryDepartureTime') as string) || null,
    ferryNotes: (formData.get('ferryNotes') as string) || null,
    availableSeats: Number(formData.get('availableSeats') || 0),
    luggageOption: String(formData.get('luggageOption') || 'almindelig'),
    petsOption: String(formData.get('petsOption') || 'nej'),
    smoking: formData.get('smoking') === 'on',
    comment: (formData.get('comment') as string) || null,
    directCostEstimateDkk: num(formData, 'directCostEstimateDkk') ?? null,
    ferryCostDkk: num(formData, 'ferryCostDkk') ?? null,
    tollCostDkk: num(formData, 'tollCostDkk') ?? null,
    seatPriceDkk: num(formData, 'seatPriceDkk') ?? 0,
  }

  const parsed = createRideSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Udfyld venligst alle påkrævede felter korrekt.' }
  }
  const input = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const { data: profile } = await supabase.from('profiles').select('email_verified, phone_verified').eq('id', user.id).single()
  const { data: declaration } = await supabase
    .from('driver_declarations')
    .select('id')
    .eq('user_id', user.id)
    .eq('declaration_version', DRIVER_DECLARATION_VERSION)
    .maybeSingle()

  if (!profile || !canPublishRide(profile, !!declaration)) {
    return {
      success: false,
      error: !profile || !isVerified(profile)
        ? 'Du skal have en bekræftet e-mail for at oprette en tur.'
        : 'Du skal bekræfte chaufførerklæringen, før du kan oprette en tur.',
    }
  }

  const settings = await getAppSettings()

  let route
  try {
    route = await geo.route([
      { lat: input.origin.lat, lng: input.origin.lng },
      { lat: input.destination.lat, lng: input.destination.lng },
    ])
  } catch (err) {
    console.error('ride_route_calculation_failed', err instanceof GeoProviderError ? err.message : err)
    return { success: false, error: 'Kunne ikke beregne ruten. Prøv igen om lidt.' }
  }

  const { maxContributionPerPassengerDkk } = computeMaxContribution({
    distanceKm: route.distanceKm,
    seatsOffered: input.availableSeats,
    directCostEstimateDkk: input.directCostEstimateDkk,
    ferryCostDkk: input.ferryCostDkk,
    tollCostDkk: input.tollCostDkk,
    settings: settings.pricing,
  })

  if (!isSeatPriceWithinCap(input.seatPriceDkk, maxContributionPerPassengerDkk)) {
    return {
      success: false,
      error: 'Prisen er højere end det maksimale bidrag, der kan angives for denne tur.',
    }
  }

  const { data: ride, error: insertError } = await supabase
    .from('rides')
    .insert({
      driver_id: user.id,
      origin_name: input.origin.name,
      origin_lat: input.origin.lat,
      origin_lng: input.origin.lng,
      destination_name: input.destination.name,
      destination_lat: input.destination.lat,
      destination_lng: input.destination.lng,
      departure_date: input.departureDate,
      departure_time: input.departureTime,
      time_flexibility: input.timeFlexibility,
      distance_km: route.distanceKm,
      duration_minutes: route.durationMinutes,
      route_polyline: route.polyline,
      uses_ferry: input.usesFerry,
      ferry_route_id: input.usesFerry ? (input.ferryRouteId ?? null) : null,
      ferry_departure_time: input.usesFerry ? (input.ferryDepartureTime ?? null) : null,
      ferry_notes: input.usesFerry && input.ferryNotes ? sanitizePlainText(input.ferryNotes, 300) : null,
      available_seats: input.availableSeats,
      original_seats: input.availableSeats,
      luggage_option: input.luggageOption,
      pets_option: input.petsOption,
      smoking: input.smoking,
      comment: input.comment ? sanitizePlainText(input.comment, 500) : null,
      direct_cost_estimate: input.directCostEstimateDkk ?? null,
      seat_price: input.seatPriceDkk,
      status: 'PUBLISHED',
    })
    .select('id')
    .single()

  if (insertError || !ride) {
    console.error('ride_insert_failed', insertError)
    return { success: false, error: 'Kunne ikke oprette turen. Prøv igen.' }
  }

  const sampled = sampleRoutePoints(route.points, settings.routePointSampleIntervalKm)
  if (sampled.length > 0) {
    const { error: pointsError } = await supabase.from('ride_route_points').insert(
      sampled.map((p) => ({
        ride_id: ride.id,
        sequence: p.sequence,
        point: `SRID=4326;POINT(${p.lng} ${p.lat})`,
        distance_from_origin_km: p.distanceFromOriginKm ?? null,
      }))
    )
    if (pointsError) console.error('ride_route_points_insert_failed', pointsError)
  }

  redirect(`/tur/${ride.id}`)
}
