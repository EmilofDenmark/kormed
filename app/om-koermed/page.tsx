import type { Metadata } from 'next'
import { brand } from '@/lib/config/brand'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = { title: `Om ${brand.name}` }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Om {brand.name}</h1>
        <p className="text-ink-700">{brand.tagline}</p>
      </div>

      <Card>
        <p className="text-sm text-ink-700">
          {brand.name} er en dansk formidlingsplatform for samkørsel. Vi gør det enkelt for folk, der allerede skal
          en tur, at dele en ledig plads med andre, der skal samme vej — og for passagerer at finde et lift og bidrage
          til de direkte omkostninger ved turen.
        </p>
        <p className="mt-3 text-sm text-ink-700">
          {brand.name} udfører ikke selv persontransport, er ikke et taxaselskab, og chauffører hverken arbejder for
          eller tjener penge via platformen. Kernefunktionaliteten er gratis at bruge, og sådan vil vi gerne holde det.
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <LinkButton href="/samkoersel" variant="outline">Sådan fungerer {brand.name}</LinkButton>
        <LinkButton href="/stoet-koermed" variant="ghost">Støt {brand.name}</LinkButton>
      </div>
    </div>
  )
}
