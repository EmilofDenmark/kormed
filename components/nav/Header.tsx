import Link from 'next/link'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'
import { MobileNav } from './MobileNav'
import { LinkButton } from '@/components/ui/Button'
import { MessageIcon } from '@/components/ui/icons'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { getCurrentProfile } from '@/lib/session'

export async function Header() {
  const profile = await getCurrentProfile()

  return (
    <header className="sticky top-0 z-40 border-b border-ink-300/20 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Hovedmenu">
          <Link href="/find-lift" className="text-sm font-medium text-ink-700 hover:text-brand-dark">
            Find lift
          </Link>
          <Link href="/tilbyd-lift" className="text-sm font-medium text-ink-700 hover:text-brand-dark">
            Tilbyd lift
          </Link>
          <Link href="/samkoersel" className="text-sm font-medium text-ink-700 hover:text-brand-dark">
            Sådan virker det
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {profile && (
            <>
              <Link
                href="/beskeder"
                aria-label="Beskeder"
                className="hidden rounded-full p-2.5 hover:bg-brand-neutral md:inline-flex"
              >
                <MessageIcon />
              </Link>
              <NotificationsMenu userId={profile.id} />
            </>
          )}

          {profile ? (
            <UserMenu firstName={profile.first_name} avatarUrl={profile.avatar_url} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <LinkButton href="/log-ind" variant="ghost">
                Log ind
              </LinkButton>
              <LinkButton href="/tilmeld" variant="primary">
                Opret konto
              </LinkButton>
            </div>
          )}
        </div>
      </div>

      <MobileNav loggedIn={!!profile} />
    </header>
  )
}
