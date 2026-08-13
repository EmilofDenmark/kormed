import Link from 'next/link'
import { SearchIcon, CarIcon, MessageIcon, UserIcon } from '@/components/ui/icons'

/** Simple bottom nav for mobile (spec §34) — no hamburger, four large touch targets. */
export function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <nav
      aria-label="Hovedmenu"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-300/20 bg-surface md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <MobileLink href="/find-lift" label="Find lift" icon={<SearchIcon />} />
      <MobileLink href="/tilbyd-lift" label="Tilbyd lift" icon={<CarIcon />} />
      <MobileLink href="/beskeder" label="Beskeder" icon={<MessageIcon />} />
      <MobileLink href={loggedIn ? '/profil' : '/log-ind'} label="Profil" icon={<UserIcon />} />
    </nav>
  )
}

function MobileLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-ink-700">
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  )
}
