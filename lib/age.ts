export const MINIMUM_AGE = 18

export function calculateAge(dateOfBirth: string | Date, referenceDate: Date = new Date()): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  let age = referenceDate.getFullYear() - dob.getFullYear()
  const monthDiff = referenceDate.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export function isAdult(dateOfBirth: string | Date, referenceDate?: Date): boolean {
  return calculateAge(dateOfBirth, referenceDate) >= MINIMUM_AGE
}
