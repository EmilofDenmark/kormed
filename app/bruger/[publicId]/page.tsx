import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { RatingStars } from '@/components/ui/RatingStars'
import { Badge } from '@/components/ui/Badge'
import { CheckIcon, UserIcon } from '@/components/ui/icons'
import { ReportContentLink } from '@/components/notices/ReportContentLink'

export const metadata: Metadata = { title: 'Profil', robots: { index: false } }

export default async function PublicProfilePage({ params }: { params: { publicId: string } }) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('public_id', params.publicId)
    .single()

  if (!profile) notFound()

  const { data: ratings } = await supabase
    .from('public_ratings')
    .select('id, stars, comment, comment_hidden, created_at')
    .eq('ratee_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <Card className="flex items-start gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-neutral text-brand-dark">
            <UserIcon width={28} height={28} />
          </span>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-brand-dark">{profile.first_name}</h1>
          <p className="text-sm text-ink-500">Medlem siden {new Date(profile.created_at).getFullYear()}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.email_verified && (
              <Badge tone="green"><CheckIcon width={14} height={14} />E-mail verificeret</Badge>
            )}
            {profile.phone_verified && (
              <Badge tone="green"><CheckIcon width={14} height={14} />Telefon verificeret</Badge>
            )}
          </div>
          <div className="mt-3">
            <RatingStars value={profile.rating_avg} count={profile.rating_count} />
          </div>
          <p className="mt-1 text-sm text-ink-500">{profile.completed_rides_count} gennemførte ture</p>
        </div>
      </Card>

      {profile.bio && (
        <Card>
          <p className="text-sm text-brand-dark">{profile.bio}</p>
        </Card>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-brand-dark">Bedømmelser</h2>
        {!ratings || ratings.length === 0 ? (
          <p className="text-sm text-ink-500">Ingen bedømmelser endnu.</p>
        ) : (
          <ul className="space-y-4">
            {ratings.map((r) => (
              <li key={r.id} className="border-b border-ink-300/20 pb-4 last:border-none last:pb-0">
                <RatingStars value={r.stars} count={1} size="sm" />
                {r.comment && !r.comment_hidden && (
                  <>
                    <p className="mt-1 text-sm text-ink-700">{r.comment}</p>
                    <ReportContentLink contentType="rating_comment" contentId={r.id} />
                  </>
                )}
                {r.comment_hidden && <p className="mt-1 text-sm italic text-ink-500">Kommentar skjult af administrator.</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ReportContentLink contentType="profile" contentId={profile.id} />
    </div>
  )
}
