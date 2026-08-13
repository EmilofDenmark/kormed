import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { SettingField } from '@/components/admin/SettingField'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('app_settings').select('key, value, description')
  const map = new Map((settings ?? []).map((s) => [s.key, s]))

  // app_settings.value is jsonb (typed `unknown`) — cast at the display boundary,
  // since each SettingField call already declares the expected primitive type.
  const get = (key: string): number | string | boolean | undefined => map.get(key)?.value as number | string | boolean | undefined
  const desc = (key: string) => map.get(key)?.description ?? undefined

  return (
    <div className="space-y-6">
      <Card className="border-warning/40 bg-warning/5">
        <p className="text-sm font-medium text-brand-dark">Juridisk gennemgang påkrævet</p>
        <p className="text-sm text-ink-700">
          Prislogikken herunder er en administrativt konfigurerbar model, ikke en juridisk fastsat sats. Se{' '}
          <code>lib/pricing/costSharing.ts</code> og README før produktionslancering.
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Prisberegning</h2>
        <SettingField settingKey="price_per_km_dkk" label="Kr. pr. km" description={desc('price_per_km_dkk')} type="number" value={get('price_per_km_dkk') ?? 2} />
        <SettingField settingKey="ferry_cost_pass_through_pct" label="Andel af færgeudgift (%)" description={desc('ferry_cost_pass_through_pct')} type="number" value={get('ferry_cost_pass_through_pct') ?? 100} />
        <SettingField settingKey="toll_cost_pass_through_pct" label="Andel af bro-/vejafgift (%)" description={desc('toll_cost_pass_through_pct')} type="number" value={get('toll_cost_pass_through_pct') ?? 100} />
        <SettingField
          settingKey="price_rounding_method"
          label="Afrundingsmetode"
          description={desc('price_rounding_method')}
          type="string"
          value={get('price_rounding_method') ?? 'nearest_5'}
          options={[
            { value: 'nearest_1', label: 'Nærmeste 1 kr.' },
            { value: 'nearest_5', label: 'Nærmeste 5 kr.' },
            { value: 'nearest_10', label: 'Nærmeste 10 kr.' },
          ]}
        />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Søgning</h2>
        <SettingField settingKey="search_radius_km" label="Søgeradius for delvist match (km)" description={desc('search_radius_km')} type="number" value={get('search_radius_km') ?? 12} />
        <SettingField settingKey="route_point_sample_interval_km" label="Afstand mellem rutepunkter (km)" description={desc('route_point_sample_interval_km')} type="number" value={get('route_point_sample_interval_km') ?? 10} />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Ture</h2>
        <SettingField settingKey="auto_complete_grace_hours" label="Timer før automatisk gennemførsel" description={desc('auto_complete_grace_hours')} type="number" value={get('auto_complete_grace_hours') ?? 24} />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Databehandling</h2>
        <SettingField settingKey="data_retention_messages_days" label="Opbevaring af beskeder (dage)" description={desc('data_retention_messages_days')} type="number" value={get('data_retention_messages_days') ?? 730} />
        <SettingField settingKey="data_retention_cancelled_rides_days" label="Opbevaring af aflyste ture (dage)" description={desc('data_retention_cancelled_rides_days')} type="number" value={get('data_retention_cancelled_rides_days') ?? 365} />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-brand-dark">Feature flags</h2>
        <p className="mb-2 text-sm text-ink-500">Disse skal forblive slået fra i denne version af {' '}<code>KørMed</code>.</p>
        <SettingField settingKey="payments_enabled" label="Betalinger" description={desc('payments_enabled')} type="boolean" value={get('payments_enabled') ?? false} />
        <SettingField settingKey="recurring_rides_enabled" label="Gentagne ture" description={desc('recurring_rides_enabled')} type="boolean" value={get('recurring_rides_enabled') ?? false} />
        <SettingField settingKey="analytics_enabled" label="Analytics" description={desc('analytics_enabled')} type="boolean" value={get('analytics_enabled') ?? false} />
      </Card>
    </div>
  )
}
