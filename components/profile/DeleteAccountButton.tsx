'use client'

import { useState } from 'react'
import { deleteMyAccount } from '@/lib/actions/profile'
import { Button } from '@/components/ui/Button'

export function DeleteAccountButton() {
  const [armed, setArmed] = useState(false)

  if (!armed) {
    return (
      <Button type="button" variant="outline" onClick={() => setArmed(true)}>
        Slet min konto
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
      <p className="mb-3 text-sm text-brand-dark">
        Dette anonymiserer dine personoplysninger (navn, e-mail, telefon, billede) med det samme og logger dig ud.
        Historik der er nødvendig af hensyn til andre brugere eller lovkrav, f.eks. gennemførte ture og bedømmelser,
        bevares men uden dine personlige oplysninger. Dette kan ikke fortrydes.
      </p>
      <div className="flex gap-3">
        <form action={async () => { await deleteMyAccount() }}>
          <Button type="submit" variant="danger">Ja, slet min konto permanent</Button>
        </form>
        <Button type="button" variant="ghost" onClick={() => setArmed(false)}>Fortryd</Button>
      </div>
    </div>
  )
}
