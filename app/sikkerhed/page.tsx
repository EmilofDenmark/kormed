import type { Metadata } from 'next'
import Link from 'next/link'
import { brand } from '@/lib/config/brand'
import { Card } from '@/components/ui/Card'
import { ShieldIcon } from '@/components/ui/icons'

export const metadata: Metadata = { title: 'Sikkerhed' }

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <ShieldIcon width={28} height={28} className="text-brand-green" />
        <h1 className="text-2xl font-semibold text-brand-dark">Sikkerhed</h1>
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Verifikation</h2>
        <p className="text-sm text-ink-700">
          Alle brugere skal bekræfte deres e-mail, før de kan booke eller tilbyde en tur, og skal være mindst 18
          år. Dette er ikke det samme som en identitetsverifikation med offentligt ID — {brand.name} udfører ikke
          myndighedskontrol af, hvem du er. Telefonnumre bliver ikke verificeret af siden.
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Før turen</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-ink-700">
          <li>Se chaufførens eller passagerens profil, bedømmelse og antal gennemførte ture.</li>
          <li>
            Vi opfordrer til, at I koordinerer turen via mobil (opkald eller SMS) og ikke kun på siden — det
            gør det nemmere at sikre, at I begge er trygge ved aftalen.
          </li>
          <li>Aftal det præcise mødested i chatten eller over telefonen — del det aldrig offentligt.</li>
          <li>Del aldrig kodeord, kortoplysninger eller andre følsomme oplysninger i chatten.</li>
          <li>Fortæl gerne en du kender, hvornår og med hvem du kører.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Betaling</h2>
        <p className="text-sm text-ink-700">
          {brand.name} håndterer ikke betaling. Bidraget til turens omkostninger aftales og udveksles direkte mellem
          chauffør og passager, fx via MobilePay.
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Anmeld problemer</h2>
        <p className="text-sm text-ink-700">
          Hvis du oplever ulovligt eller stødende indhold, kan du{' '}
          <Link href="/anmeld-ulovligt-indhold" className="underline">anmelde det her</Link>. Ved akut fare, kontakt
          altid politiet direkte (112/114).
        </p>
      </Card>
    </div>
  )
}
