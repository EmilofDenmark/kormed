'use client'

import { useState } from 'react'
import { DriverDeclaration } from '@/components/ride/DriverDeclaration'
import { CreateRideWizard } from '@/components/ride/CreateRideWizard'
import type { PricingSettings } from '@/lib/pricing/costSharing'
import type { FerryRouteOption } from '@/components/search/FilterForm'

export function TilbydLiftClient({
  ferryRoutes,
  pricingSettings,
  declarationAccepted,
}: {
  ferryRoutes: FerryRouteOption[]
  pricingSettings: PricingSettings
  declarationAccepted: boolean
}) {
  const [accepted, setAccepted] = useState(declarationAccepted)

  if (!accepted) {
    return <DriverDeclaration onAccepted={() => setAccepted(true)} />
  }

  return <CreateRideWizard ferryRoutes={ferryRoutes} pricingSettings={pricingSettings} />
}
