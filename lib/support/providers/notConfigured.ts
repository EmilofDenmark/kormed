import type { SupportProvider } from '../types'

/**
 * Fallback used whenever the configured provider (app_settings
 * `support_payment_provider`) has no working credentials/link set up yet.
 * Never fakes a successful payment flow — the contribution is still
 * recorded (status stays PENDING) so an admin can see intent to support and
 * follow up manually, but the UI is told there's nowhere to redirect to.
 */
export const notConfiguredProvider: SupportProvider = {
  name: 'not_configured',
  isConfigured: () => false,
  startContribution() {
    return { redirectUrl: null, providerPaymentId: null }
  },
}
