import { z } from 'zod'
import { isAdult } from '../age'

const phoneRegex = /^\+45\d{8}$/

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'Fornavn er påkrævet').max(60),
  lastName: z.string().trim().min(1, 'Efternavn er påkrævet').max(60),
  email: z.string().trim().email('Ugyldig e-mailadresse').max(254),
  phone: z.string().trim().regex(phoneRegex, 'Telefonnummer skal være et dansk nummer, fx +4512345678'),
  password: z.string().min(8, 'Adgangskoden skal være mindst 8 tegn').max(128),
  dateOfBirth: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Ugyldig fødselsdato')
    .refine((v) => isAdult(v), 'Du skal være mindst 18 år for at oprette en konto'),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Du skal acceptere vilkårene' }) }),
  acceptedPrivacy: z.literal(true, { errorMap: () => ({ message: 'Du skal acceptere privatlivspolitikken' }) }),
})

export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().email('Ugyldig e-mailadresse'),
  password: z.string().min(1, 'Adgangskode er påkrævet'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const phoneOtpRequestSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Telefonnummer skal være et dansk nummer, fx +4512345678'),
})

export const phoneOtpVerifySchema = z.object({
  phone: z.string().trim().regex(phoneRegex),
  token: z.string().trim().length(6, 'Koden skal være 6 cifre'),
})

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(300).optional().nullable(),
})
