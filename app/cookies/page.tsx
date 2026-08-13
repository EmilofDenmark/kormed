import type { Metadata } from 'next'
import { brand } from '@/lib/config/brand'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Cookies' }

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Cookies</h1>
        <p className="text-ink-700">
          {brand.name} bruger udelukkende teknisk nødvendige cookies. Vi viser derfor ikke et cookie-samtykke-banner,
          da det ikke er påkrævet for cookies, der er strengt nødvendige for at levere tjenesten du selv har bedt om.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Nødvendige cookies</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-300/20 text-ink-500">
              <th className="py-2 pr-4">Cookie</th>
              <th className="py-2 pr-4">Formål</th>
              <th className="py-2">Varighed</th>
            </tr>
          </thead>
          <tbody className="text-ink-700">
            <tr className="border-b border-ink-300/10">
              <td className="py-2 pr-4">sb-access-token / sb-refresh-token</td>
              <td className="py-2 pr-4">Holder dig logget ind (Supabase Auth)</td>
              <td className="py-2">Op til 7 dage / ved log ud</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Ingen sporing</h2>
        <p className="text-sm text-ink-700">
          Vi bruger ikke Google Analytics, Meta Pixel, annoncesporing eller andre marketingcookies. Hvis vi på et
          tidspunkt tilføjer valgfri statistik, vil det kræve dit forudgående samtykke, og indtil da kører der ikke
          nogen sporingsscripts, uanset kontoindstillinger.
        </p>
      </Card>
    </div>
  )
}
