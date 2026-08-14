'use client'

import { useState } from 'react'
import { Label, Input, FieldError, HelpText } from '@/components/ui/Field'

/**
 * Native <input type="date"> renders in whatever format the visitor's
 * browser/OS locale dictates — not something a site can override. This
 * shows/accepts DD/MM/ÅÅÅÅ for everyone regardless of locale, and submits
 * the underlying "dateOfBirth" field as an ISO yyyy-mm-dd string (what
 * lib/validation/auth.ts and Postgres both expect).
 */
export function DateOfBirthField({ error }: { error?: string }) {
  const [display, setDisplay] = useState('')
  const [isoValue, setIsoValue] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8) // ddmmyyyy

    let formatted = digits
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    setDisplay(formatted)

    if (digits.length === 8) {
      const day = digits.slice(0, 2)
      const month = digits.slice(2, 4)
      const year = digits.slice(4, 8)
      setIsoValue(`${year}-${month}-${day}`)
    } else {
      setIsoValue('')
    }
  }

  return (
    <div>
      <Label htmlFor="dateOfBirthDisplay">Fødselsdato</Label>
      <Input
        id="dateOfBirthDisplay"
        inputMode="numeric"
        placeholder="DD/MM/ÅÅÅÅ"
        autoComplete="bday"
        value={display}
        onChange={handleChange}
        maxLength={10}
        pattern="\d{2}/\d{2}/\d{4}"
        title="Indtast datoen som DD/MM/ÅÅÅÅ"
        required
      />
      <input type="hidden" name="dateOfBirth" value={isoValue} />
      <FieldError>{error}</FieldError>
      <HelpText>Du skal være mindst 18 år for at oprette en konto.</HelpText>
    </div>
  )
}
