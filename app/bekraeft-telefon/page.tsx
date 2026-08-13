import type { Metadata } from 'next'
import { requireProfile } from '@/lib/session'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm'

export const metadata: Metadata = { title: 'Bekræft telefonnummer' }

export default async function ConfirmPhonePage() {
  const profile = await requireProfile()

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Bekræft dit telefonnummer</h1>
      <p className="mb-6 text-ink-500">
        Du skal have en verificeret e-mail og et verificeret telefonnummer, før du kan oprette eller booke ture.
      </p>
      <Card>
        {profile.phone_verified ? (
          <div className="space-y-4 text-center">
            <p className="font-medium text-brand-dark">Dit telefonnummer er bekræftet ✓</p>
            <LinkButton href="/profil">Til din profil</LinkButton>
          </div>
        ) : (
          <PhoneOtpForm currentPhone={profile.phone} />
        )}
      </Card>
    </div>
  )
}
