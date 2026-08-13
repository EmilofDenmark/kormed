/**
 * Modular payment provider abstraction for voluntary support contributions
 * (spec update §3: "Implement the support payment provider through a
 * separate modular payment service so it can be changed later"). Completely
 * independent of ride/booking payments, which remain unhandled by the
 * platform entirely — see lib/actions/bookings.ts and spec §15.
 */

export interface StartContributionInput {
  amountDkk: number
  contributionId: string
}

export interface StartContributionResult {
  /** Where to send the browser to complete payment, or null if this provider can't do that (yet). */
  redirectUrl: string | null
  providerPaymentId: string | null
}

export interface SupportProvider {
  readonly name: string
  isConfigured(): boolean
  startContribution(input: StartContributionInput): StartContributionResult
}
