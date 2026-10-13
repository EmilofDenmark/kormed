import Link from 'next/link'
import { brand } from '@/lib/config/brand'
import { getAppSettings } from '@/lib/settings'

/**
 * Four-column footer structure per the KørMed brand update — "Støt
 * projektet" is its own column, kept visually equal-weight with the other
 * three rather than emphasised (spec update §7/§10: support must never
 * become the main purpose of the site).
 */
export async function Footer() {
  const settings = await getAppSettings()

  return (
    <footer className="mt-16 border-t border-ink-300/20 bg-brand-neutral/40 pb-20 pt-10 md:pb-10">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-brand-dark">{brand.name}</p>
            <ul className="mt-2 space-y-2 text-sm text-ink-500">
              <li><Link href="/find-lift" className="hover:text-brand-dark">Find lift</Link></li>
              <li><Link href="/tilbyd-lift" className="hover:text-brand-dark">Tilbyd lift</Link></li>
              <li><Link href="/samkoersel" className="hover:text-brand-dark">Sådan fungerer {brand.name}</Link></li>
              <li><Link href="/gem-som-app" className="hover:text-brand-dark">Gem som app</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Information</p>
            <ul className="mt-2 space-y-2 text-sm text-ink-500">
              <li><Link href="/om-koermed" className="hover:text-brand-dark">Om {brand.name}</Link></li>
              <li><Link href="/sikkerhed" className="hover:text-brand-dark">Sikkerhed</Link></li>
              <li><Link href="/samkoersel" className="hover:text-brand-dark">Samkørsel</Link></li>
              <li><Link href="/kontakt" className="hover:text-brand-dark">Kontakt</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Juridisk</p>
            <ul className="mt-2 space-y-2 text-sm text-ink-500">
              <li><Link href="/vilkaar" className="hover:text-brand-dark">Vilkår</Link></li>
              <li><Link href="/privatliv" className="hover:text-brand-dark">Privatliv</Link></li>
              <li><Link href="/cookies" className="hover:text-brand-dark">Cookies</Link></li>
              <li><Link href="/anmeld-ulovligt-indhold" className="hover:text-brand-dark">Anmeld ulovligt indhold</Link></li>
            </ul>
          </div>
          {(settings.support.enabled || settings.wine.enabled) && (
            <div>
              <p className="text-sm font-semibold text-brand-dark">Støt projektet</p>
              <ul className="mt-2 space-y-2 text-sm text-ink-500">
                {settings.support.enabled && (
                  <li><Link href="/stoet-koermed" className="hover:text-brand-dark">Støt {brand.name}</Link></li>
                )}
                {settings.wine.enabled && (
                  <li>
                    <a
                      href={settings.wine.shopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-brand-dark"
                    >
                      {settings.wine.shopName}
                      <span aria-hidden="true">↗</span>
                      <span className="sr-only">(åbner i en ny fane)</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        <p className="mt-10 text-xs text-ink-500">
          {brand.name} er en formidlingsplatform for samkørsel og udfører ikke selv persontransport. © {new Date().getFullYear()} {brand.name}.
        </p>
      </div>
    </footer>
  )
}
