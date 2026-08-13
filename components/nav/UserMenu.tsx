import Link from 'next/link'
import { logOut } from '@/lib/actions/auth'
import { UserIcon } from '@/components/ui/icons'

export function UserMenu({ firstName, avatarUrl }: { firstName: string; avatarUrl: string | null }) {
  return (
    <details className="group relative">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-full px-2 py-1 hover:bg-brand-neutral [&::-webkit-details-marker]:hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-neutral text-brand-dark">
            <UserIcon width={18} height={18} />
          </span>
        )}
        <span className="hidden text-sm font-medium text-brand-dark sm:inline">{firstName}</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 rounded-card border border-ink-300/30 bg-surface p-1.5 shadow-card">
        <MenuLink href="/profil">Min profil</MenuLink>
        <MenuLink href="/mine-ture">Mine ture</MenuLink>
        <MenuLink href="/mine-bookinger">Mine bookinger</MenuLink>
        <MenuLink href="/beskeder">Beskeder</MenuLink>
        <div className="my-1 h-px bg-ink-300/20" />
        <form action={logOut}>
          <button
            type="submit"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-brand-dark hover:bg-brand-neutral"
          >
            Log ud
          </button>
        </form>
      </div>
    </details>
  )
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-lg px-3 py-2 text-sm text-brand-dark hover:bg-brand-neutral">
      {children}
    </Link>
  )
}
