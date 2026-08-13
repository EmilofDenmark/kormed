import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { SettingField } from '@/components/admin/SettingField'

export default async function AdminSupportSettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('app_settings').select('key, value, description')
  const map = new Map((settings ?? []).map((s) => [s.key, s]))

  const get = (key: string): number | string | boolean | number[] | undefined =>
    map.get(key)?.value as number | string | boolean | number[] | undefined
  const desc = (key: string) => map.get(key)?.description ?? undefined

  const { count: pendingCount } = await supabase
    .from('support_contributions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'PENDING')

  return (
    <div className="space-y-6">
      <Card className="bg-brand-neutral/40">
        <p className="text-sm text-brand-dark">
          KørMeds kernefunktionalitet er og skal forblive gratis. Disse indstillinger styrer kun det{' '}
          <strong>frivillige</strong> støttemodul og den sekundære Vin i Glasset-krydspromovering — ingen af dem må
          nogensinde påvirke søgeresultater, priser eller kræves for at booke/tilbyde en tur.
        </p>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">Frivillig støtte</h2>
          {typeof pendingCount === 'number' && (
            <span className="text-xs text-ink-500">{pendingCount} afventende bidrag</span>
          )}
        </div>
        <SettingField
          settingKey="support_enabled"
          label="Støttefunktion aktiveret"
          description={desc('support_enabled')}
          type="boolean"
          value={get('support_enabled') ?? true}
        />
        <SettingField
          settingKey="support_payment_provider"
          label="Betalingsudbyder"
          description={desc('support_payment_provider')}
          type="string"
          value={get('support_payment_provider') ?? 'manual'}
          options={[
            { value: 'manual', label: 'Ikke konfigureret (viser tak-besked)' },
            { value: 'mobilepay_link', label: 'MobilePay-link (SUPPORT_MOBILEPAY_LINK_URL)' },
          ]}
        />
        <SettingField
          settingKey="support_suggested_amounts"
          label="Foreslåede beløb (kr.)"
          description={desc('support_suggested_amounts')}
          type="number_array"
          value={get('support_suggested_amounts') ?? [25, 50, 100]}
        />
        <SettingField
          settingKey="support_custom_amount_enabled"
          label="Tillad valgfrit beløb"
          description={desc('support_custom_amount_enabled')}
          type="boolean"
          value={get('support_custom_amount_enabled') ?? true}
        />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Vin i Glasset</h2>
        <SettingField
          settingKey="wine_promotion_enabled"
          label="Krydspromovering aktiveret"
          description={desc('wine_promotion_enabled')}
          type="boolean"
          value={get('wine_promotion_enabled') ?? true}
        />
        <SettingField
          settingKey="wine_shop_name"
          label="Navn"
          description={desc('wine_shop_name')}
          type="string"
          value={get('wine_shop_name') ?? 'Vin i Glasset'}
        />
        <SettingField
          settingKey="wine_shop_url"
          label="URL"
          description={desc('wine_shop_url')}
          type="string"
          value={get('wine_shop_url') ?? 'https://viniglasset.dk'}
        />
        <SettingField
          settingKey="wine_promotion_text"
          label="Promoveringstekst"
          description={desc('wine_promotion_text')}
          type="string"
          value={get('wine_promotion_text') ?? ''}
        />
      </Card>
    </div>
  )
}
