import { describe, it, expect } from 'vitest'
import { calculateAge, isAdult, MINIMUM_AGE } from '@/lib/age'
import { signupSchema } from '@/lib/validation/auth'

// Spec §36 rule 1: only adults can create accounts.
describe('age gate', () => {
  const reference = new Date('2026-08-13')

  it('calculates age correctly across a birthday boundary', () => {
    expect(calculateAge('2008-08-13', reference)).toBe(18)
    expect(calculateAge('2008-08-14', reference)).toBe(17)
    expect(calculateAge('2008-08-12', reference)).toBe(18)
  })

  it('rejects under-18 users', () => {
    expect(isAdult('2010-01-01', reference)).toBe(false)
  })

  it('accepts exactly-18 users', () => {
    expect(isAdult('2008-08-13', reference)).toBe(true)
  })

  it(`MINIMUM_AGE is ${18}`, () => {
    expect(MINIMUM_AGE).toBe(18)
  })

  it('signupSchema rejects an underage date of birth', () => {
    const almostAdult = new Date()
    almostAdult.setFullYear(almostAdult.getFullYear() - 17)
    const result = signupSchema.safeParse({
      firstName: 'Test',
      lastName: 'Testesen',
      email: 'test@example.dk',
      phone: '+4512345678',
      password: 'a-secure-password',
      dateOfBirth: almostAdult.toISOString().slice(0, 10),
      acceptedTerms: true,
      acceptedPrivacy: true,
    })
    expect(result.success).toBe(false)
  })

  it('signupSchema accepts an 18-year-old', () => {
    const justAdult = new Date()
    justAdult.setFullYear(justAdult.getFullYear() - 18)
    justAdult.setDate(justAdult.getDate() - 1)
    const result = signupSchema.safeParse({
      firstName: 'Test',
      lastName: 'Testesen',
      email: 'test@example.dk',
      phone: '+4512345678',
      password: 'a-secure-password',
      dateOfBirth: justAdult.toISOString().slice(0, 10),
      acceptedTerms: true,
      acceptedPrivacy: true,
    })
    expect(result.success).toBe(true)
  })
})
