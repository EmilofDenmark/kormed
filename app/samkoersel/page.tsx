import type { Metadata } from 'next'
import { brand } from '@/lib/config/brand'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = { title: 'Sådan fungerer samkørsel' }

const STEPS = [
  'Chaufføren opretter en tur, som chaufføren allerede skal køre.',
  'Chaufføren angiver ledige pladser.',
  'Passageren anmoder om en plads.',
  'Chaufføren accepterer eller afviser.',
  'I aftaler det præcise mødested i chatten.',
  'Passageren bidrager til turens direkte omkostninger.',
  'Platformen håndterer ikke betalingen.',
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Sådan fungerer samkørsel</h1>
        <p className="text-ink-700">
          {brand.name} er en formidlingsplatform og udfører ikke selv persontransport.
        </p>
      </div>

      <Card>
        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 text-brand-dark">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="bg-brand-neutral/40">
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Hvad samkørsel ikke er</h2>
        <p className="text-sm text-ink-700">
          Chauffører på {brand.name} arbejder ikke for og er ikke ansat af {brand.name}. De tjener ikke penge ved at
          bruge platformen og udbyder ikke en taxaservice — de deler blot en tur, de alligevel skal køre, med andre
          der skal samme vej.
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <LinkButton href="/find-lift">Find lift</LinkButton>
        <LinkButton href="/tilbyd-lift" variant="outline">Tilbyd et lift</LinkButton>
      </div>
    </div>
  )
}
