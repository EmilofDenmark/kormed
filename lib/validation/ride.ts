import { z } from 'zod'

const latLngSchema = z.object({
  name: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const rideStep1Schema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
  departureDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Ugyldig dato'),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ugyldigt tidspunkt'),
  timeFlexibility: z.enum(['exact', 'plus_minus_30', 'plus_minus_60', 'flexible']),
})

export const rideStep2Schema = z.object({
  usesFerry: z.boolean(),
  ferryRouteId: z.string().uuid().optional().nullable(),
  ferryDepartureTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  ferryNotes: z.string().trim().max(300).optional().nullable(),
})

export const rideStep3Schema = z.object({
  availableSeats: z.number().int().min(1).max(7),
  luggageOption: z.enum(['lille', 'almindelig', 'stor']),
  petsOption: z.enum(['ja', 'nej', 'efter_aftale']),
  smoking: z.boolean(),
  comment: z.string().trim().max(500).optional().nullable(),
  directCostEstimateDkk: z.number().min(0).max(100000).optional().nullable(),
  ferryCostDkk: z.number().min(0).max(100000).optional().nullable(),
  tollCostDkk: z.number().min(0).max(100000).optional().nullable(),
  seatPriceDkk: z.number().min(0).max(100000),
})

// Exported separately (before .refine()) so its .shape stays introspectable —
// used by tests/featureFlags.test.ts to assert no recurrence field exists.
export const rideFieldsSchema = rideStep1Schema.merge(rideStep2Schema).merge(rideStep3Schema)

export const createRideSchema = rideFieldsSchema.refine((v) => !v.usesFerry || !!v.ferryRouteId, {
  message: 'Vælg en færgerute',
  path: ['ferryRouteId'],
})

export type CreateRideInput = z.infer<typeof createRideSchema>

export const searchRidesSchema = z.object({
  origin: latLngSchema.partial({ name: true }).optional(),
  destination: latLngSchema.partial({ name: true }).optional(),
  date: z.string().optional(),
  passengers: z.number().int().min(1).max(7).default(1),
  viaFerry: z.boolean().optional(),
  ferryRouteId: z.string().uuid().optional(),
})
