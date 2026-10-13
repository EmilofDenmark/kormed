import type { Metadata } from 'next'
import { brand } from '@/lib/config/brand'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: `Gem ${brand.name} som app`,
  description: `Sådan gemmer du ${brand.name} som et ikon på startskærmen på iPhone og Android.`,
}

export default function SaveAsAppPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Gem {brand.name} som app</h1>
        <p className="text-ink-700">
          Du kan lægge {brand.name} som et ikon på din telefons startskærm, så du kommer direkte ind med ét tryk — ligesom
          en almindelig app. Det er stadig den samme hjemmeside; du skal ikke hente noget i App Store eller Google Play.
        </p>
      </div>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-brand-dark">iPhone (Safari)</h2>
        <p className="mb-3 text-sm text-ink-500">Brug Safari. Andre browsere kan ikke gemme sider på hjemmeskærmen.</p>
        <ol className="list-decimal space-y-2 pl-5 text-ink-700">
          <li>Åbn {brand.name} i Safari.</li>
          <li>
            Tryk på <strong>Del</strong>-knappen (firkanten med en pil op) nederst på skærmen. På en iPad ligger den øverst.
          </li>
          <li>
            Rul ned i menuen, og tryk på <strong>Føj til hjemmeskærm</strong>.
          </li>
          <li>
            Tryk på <strong>Tilføj</strong> øverst til højre. Du kan ændre navnet først, hvis du vil.
          </li>
          <li>Ikonet ligger nu på din hjemmeskærm.</li>
        </ol>
        <p className="mt-3 text-sm text-ink-500">
          Kan du ikke se &ldquo;Føj til hjemmeskærm&rdquo;, så rul helt ned i menuen, eller tryk på <strong>Rediger handlinger</strong>{' '}
          nederst og tilføj den.
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-brand-dark">Android (Chrome)</h2>
        <p className="mb-3 text-sm text-ink-500">Menuens ordlyd kan variere lidt mellem telefoner og browsere.</p>
        <ol className="list-decimal space-y-2 pl-5 text-ink-700">
          <li>Åbn {brand.name} i Chrome.</li>
          <li>
            Tryk på <strong>menuen</strong> (de tre prikker øverst til højre).
          </li>
          <li>
            Tryk på <strong>Føj til startskærm</strong>. Ser du <strong>Installer app</strong>, så tryk på den i stedet.
          </li>
          <li>
            Tryk på <strong>Tilføj</strong> (eller <strong>Installer</strong>), og bekræft.
          </li>
          <li>Ikonet ligger nu på din startskærm eller blandt dine apps.</li>
        </ol>
        <p className="mt-3 text-sm text-ink-500">
          Bruger du Samsung Internet, så tryk på menuen (tre streger) og vælg <strong>Tilføj side til</strong> →{' '}
          <strong>Startskærm</strong>.
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Gode at vide</h2>
        <ul className="list-disc space-y-2 pl-5 text-ink-700">
          <li>Genvejen åbner altid den nyeste version af {brand.name}. Du behøver ikke opdatere noget.</li>
          <li>Du skal stadig være online, og du logger ind som normalt.</li>
          <li>Vil du fjerne ikonet igen, så tryk og hold på det og vælg <strong>Fjern</strong> (iPhone) eller <strong>Afinstaller/Fjern</strong> (Android).</li>
        </ul>
      </Card>

      <LinkButton href="/" variant="outline">Til forsiden</LinkButton>
    </div>
  )
}
