import Link from 'next/link'
import { brand } from '@/lib/config/brand'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-brand-dark" aria-label={`${brand.name} — forside`}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white"
        aria-hidden="true"
      >
        {brand.name.charAt(0)}
      </span>
      {brand.name}
    </Link>
  )
}
