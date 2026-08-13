import type { Metadata } from 'next'
import Link from 'next/link'
import { requireProfile } from '@/lib/session'
import { Card } from '@/components/ui/Card'
import { RatingStars } from '@/components/ui/RatingStars'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { VerificationStatus } from '@/components/profile/VerificationStatus'
import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton'

export const metadata: Metadata = { title: 'Min profil', robots: { index: false } }

export default async function ProfilePage() {
  const profile = await requireProfile()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Min profil</h1>
        <p className="text-ink-500">Medlem siden {new Date(profile.created_at).toLocaleDateString('da-DK')}</p>
      </div>

      <Card className="space-y-4">
        <VerificationStatus emailVerified={profile.email_verified} phoneVerified={profile.phone_verified} />
        <RatingStars value={profile.rating_avg} count={profile.rating_count} />
        <p className="text-sm text-ink-500">{profile.completed_rides_count} gennemførte ture</p>
        <Link href={`/bruger/${profile.public_id}`} className="inline-block text-sm font-medium text-brand-green underline">
          Se din offentlige profil
        </Link>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-brand-dark">Rediger profil</h2>
        <ProfileEditForm firstName={profile.first_name} bio={profile.bio} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-dark">Mine oplysninger</h2>
        <p className="text-sm text-ink-500">
          Du kan til enhver tid downloade en kopi af dine oplysninger eller slette din konto.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/mine-oplysninger/eksport"
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink-300 px-5 py-2.5 text-[15px] font-medium text-brand-dark hover:bg-brand-neutral"
          >
            Download mine oplysninger
          </a>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-dark">Slet konto</h2>
        <DeleteAccountButton />
      </Card>
    </div>
  )
}
