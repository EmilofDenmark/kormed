import 'server-only'
import { mobilepayLinkProvider } from './providers/mobilepayLink'
import { notConfiguredProvider } from './providers/notConfigured'
import type { SupportProvider } from './types'

export type { SupportProvider, StartContributionInput, StartContributionResult } from './types'

/**
 * Provider is selected per-request from the admin-editable
 * `support_payment_provider` app_setting (not a fixed env var like
 * lib/geo/lib/email), so admins can switch providers from /admin/stoette
 * without a deploy. To add a new provider: implement SupportProvider under
 * lib/support/providers/, register it here, and set the setting's value.
 */
export function selectSupportProvider(providerName: string): SupportProvider {
  switch (providerName) {
    case 'mobilepay_link':
      return mobilepayLinkProvider
    default:
      return notConfiguredProvider
  }
}
