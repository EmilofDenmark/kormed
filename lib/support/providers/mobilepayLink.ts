import 'server-only'
import type { SupportProvider } from '../types'

/**
 * Simplest real-world default for a small Danish project: a merchant-hosted
 * MobilePay payment/box link (created in the MobilePay Business portal, no
 * API keys or server-side integration required). Dynamic per-amount
 * checkout isn't supported this way — every contribution links to the same
 * box — which is an acceptable MVP trade-off; see README "Frivillig støtte"
 * for how to upgrade to a fully dynamic provider (e.g. a real Stripe/
 * MobilePay API integration) later without touching call sites.
 */
const LINK_URL = process.env.SUPPORT_MOBILEPAY_LINK_URL

export const mobilepayLinkProvider: SupportProvider = {
  name: 'mobilepay_link',
  isConfigured: () => !!LINK_URL,
  startContribution() {
    return { redirectUrl: LINK_URL ?? null, providerPaymentId: null }
  },
}
