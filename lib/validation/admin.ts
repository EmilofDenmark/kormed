import { z } from 'zod'

export const ferryRouteSchema = z.object({
  id: z.string().uuid().optional(),
  operator: z.string().trim().min(1).max(120),
  departurePort: z.string().trim().min(1).max(120),
  arrivalPort: z.string().trim().min(1).max(120),
  defaultDepartureTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  notes: z.string().trim().max(300).optional().nullable(),
  active: z.boolean().default(true),
})

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean(), z.array(z.number())]),
})

export const suspendUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
})

export const hideRideSchema = z.object({
  rideId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
})

export const legalDocumentSchema = z.object({
  type: z.enum(['terms', 'privacy']),
  content: z.string().trim().min(1),
})
